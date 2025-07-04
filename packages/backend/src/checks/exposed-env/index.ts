import {
  continueWith,
  defineCheck,
  done,
  ScanStrength,
  Severity,
} from "engine";

type ScanState = {
  envFiles: string[];
  basePath: string;
};

const ENV_FILES = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  ".env.staging",
  ".env.test",
  ".env.example",
  ".env.sample",
  ".env.backup",
  ".env.old",
  ".env.orig",
  ".env.dist",
  ".env.bak",
  ".env.dev",
  ".env.prod",
  ".env.stage",
  ".env.live",
  ".env_1",
];

const getEnvFilesToTest = (strength: ScanStrength): string[] => {
  switch (strength) {
    case ScanStrength.LOW:
      return ENV_FILES.slice(0, 1);
    case ScanStrength.MEDIUM:
      return ENV_FILES.slice(0, 5);
    case ScanStrength.HIGH:
      return ENV_FILES;
    default:
      return ENV_FILES.slice(0, 1);
  }
};

const getBasePath = (originalPath: string): string => {
  return originalPath.split("/").slice(0, -1).join("/");
};

const isValidEnvContent = (bodyText: string, contentType: string): boolean => {
  const normalizedContentType = contentType.toLowerCase().split(";")[0]?.trim();

  if (
    normalizedContentType === undefined ||
    (normalizedContentType !== "application/octet-stream" &&
      !normalizedContentType.startsWith("text/"))
  ) {
    return false;
  }

  const trimmedBody = bodyText.trim();
  if (!trimmedBody) {
    return false;
  }

  const commentPattern = /^#\s*\w+/m;
  const keyValuePattern = /^\w+\s*=\s*.+/m;

  return commentPattern.test(trimmedBody) || keyValuePattern.test(trimmedBody);
};

export default defineCheck<ScanState>(({ step }) => {
  step("setupScan", (_, context) => {
    const envFiles = getEnvFilesToTest(context.config.strength);
    const basePath = getBasePath(context.target.request.getPath());

    return continueWith({
      nextStep: "testEnvFile",
      state: { envFiles, basePath },
    });
  });

  step("testEnvFile", async (state, context) => {
    // If there are no more files to test, we're done
    if (state.envFiles.length === 0) {
      return done();
    }

    const [currentFile, ...remainingFiles] = state.envFiles;
    if (currentFile === undefined) {
      return done();
    }

    const envPath = state.basePath + "/" + currentFile;
    const request = context.target.request.toSpec();

    request.setPath(envPath);
    request.setMethod("GET");

    const { response } = await context.sdk.requests.send(request);

    if (response.getCode() === 200) {
      const body = response.getBody();
      if (body) {
        const bodyText = body.toText();
        const contentType = response.getHeader("content-type")?.[0] ?? "";

        if (isValidEnvContent(bodyText, contentType)) {
          return done({
            findings: [
              {
                name: "Exposed Environment File",
                description: `Environment file is publicly accessible at \`${envPath}\`. This file may contain sensitive configuration data, API keys, or credentials.`,
                severity: Severity.CRITICAL,
                correlation: {
                  requestID: context.target.request.getId(),
                  locations: [],
                },
              },
            ],
          });
        }
      }
    }

    // Move on to the next file
    return continueWith({
      nextStep: "testEnvFile",
      state: {
        ...state,
        envFiles: remainingFiles,
      },
    });
  });

  return {
    metadata: {
      id: "exposed-env",
      name: "Exposed Environment File",
      description:
        "Detects publicly accessible environment files (.env, .env.local, etc.) that may contain sensitive configuration data",
      type: "active",
      tags: ["information-disclosure"],
      aggressivity: {
        minRequests: 1,
        maxRequests: ENV_FILES.length,
      },
    },

    initState: () => ({ envFiles: [], basePath: "" }),
    dedupeKey: (context) => {
      const basePath = getBasePath(context.request.getPath());
      return context.request.getHost() + context.request.getPort() + basePath;
    },
  };
});
