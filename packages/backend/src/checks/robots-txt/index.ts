import {
  continueWith,
  defineCheck,
  done,
  Severity,
} from "engine";

const ROBOTS_TXT_PATHS = [
  "/robots.txt",
  "/robots.TXT",
  "/ROBOTS.TXT",
  "/Robots.txt",
];

const isValidRobotsTxtContent = (bodyText: string): boolean => {
  const trimmedBody = bodyText.trim();
  if (!trimmedBody) {
    return false;
  }

  // Check for common robots.txt patterns
  const userAgentPattern = /User-Agent:\s*\*/i;
  const disallowPattern = /Disallow:\s*/i;
  const allowPattern = /Allow:\s*/i;
  const sitemapPattern = /Sitemap:\s*/i;
  const crawlDelayPattern = /Crawl-Delay:\s*/i;

  // A valid robots.txt should contain at least one of these patterns
  return (
    userAgentPattern.test(trimmedBody) ||
    disallowPattern.test(trimmedBody) ||
    allowPattern.test(trimmedBody) ||
    sitemapPattern.test(trimmedBody) ||
    crawlDelayPattern.test(trimmedBody)
  );
};

const getBasePath = (originalPath: string): string => {
  return originalPath.split("/").slice(0, -1).join("/");
};

export default defineCheck<{
  robotsPaths: string[];
  basePath: string;
}>(({ step }) => {
  step("setupScan", (_, context) => {
    const robotsPaths = ROBOTS_TXT_PATHS;
    const basePath = getBasePath(context.target.request.getPath());

    return continueWith({
      nextStep: "testRobotsPath",
      state: { robotsPaths, basePath },
    });
  });

  step("testRobotsPath", async (state, context) => {
    if (state.robotsPaths.length === 0) {
      return done({
        state,
      });
    }

    const [currentPath, ...remainingPaths] = state.robotsPaths;
    if (currentPath === undefined) {
      return done({
        state,
      });
    }

    const robotsPath = state.basePath + currentPath;
    const request = context.target.request.toSpec();

    request.setPath(robotsPath);
    request.setMethod("GET");

    const result = await context.sdk.requests.send(request);

    if (result.response.getCode() === 200) {
      const body = result.response.getBody();
      if (body) {
        const bodyText = body.toText();

        // Check if it's a valid robots.txt file
        if (isValidRobotsTxtContent(bodyText)) {
          return done({
            findings: [
              {
                name: "Robots.txt File Exposed",
                description: `Robots.txt file is publicly accessible at \`${robotsPath}\`. This file may reveal directory structure, hidden paths, and crawling policies that could be useful for reconnaissance.`,
                severity: Severity.INFO,
                correlation: {
                  requestID: result.request.getId(),
                  locations: [],
                },
              },
            ],
            state,
          });
        }
      }
    }

    return continueWith({
      nextStep: "testRobotsPath",
      state: {
        ...state,
        robotsPaths: remainingPaths,
      },
    });
  });

  return {
    metadata: {
      id: "robots-txt",
      name: "Robots.txt File",
      description:
        "Detects publicly accessible robots.txt files that may reveal directory structure and crawling policies",
      type: "active",
      tags: ["information-disclosure"],
      severities: [Severity.INFO],
      aggressivity: {
        minRequests: 1,
        maxRequests: ROBOTS_TXT_PATHS.length,
      },
    },

    initState: () => ({ robotsPaths: [], basePath: "" }),
    dedupeKey: (context) => {
      const basePath = getBasePath(context.request.getPath());
      return context.request.getHost() + context.request.getPort() + basePath;
    },
  };
});
