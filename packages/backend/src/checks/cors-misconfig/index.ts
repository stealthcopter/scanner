import {
  continueWith,
  defineCheck,
  done,
  ScanAggressivity,
  Severity,
} from "engine";

type CorsTestResult = {
  testType: string;
  allowOriginHeader: string | undefined;
  allowCredentialsHeader: string | undefined;
  finding?: {
    name: string;
    description: string;
    severity: Severity;
  };
};

type CorsState = {
  currentTestIndex: number;
  testResults: CorsTestResult[];
  requestHost: string;
  requestScheme: string;
  originalUrl: string;
};

const createOriginTests = (host: string, scheme: string) => {
  const tests = [
    {
      name: "arbitrary-origin-reflection",
      origin: `${scheme}://example.com`,
      description:
        "Tests if server reflects any origin in Access-Control-Allow-Origin header",
    },
    {
      name: "subdomain-wildcard",
      origin: `${scheme}://${host}.example.com`,
      description: "Tests if subdomains are allowed (e.g. target.example.com)",
    },
    {
      name: "domain-prefix",
      origin: `${scheme}://evil${host}`,
      description:
        "Tests if domains with target as suffix are allowed (e.g. eviltarget.com)",
    },
    {
      name: "null-origin",
      origin: "null",
      description: "Tests if null origin is allowed",
    },
    {
      name: "underscore-bypass",
      origin: `${scheme}://${host}_.example.com`,
      description: "Tests for underscore bypass (e.g. target_.example.com)",
    },
  ];

  if (host.split(".").length > 2) {
    tests.push({
      name: "regex-bypass",
      origin: `${scheme}://${host.replace(".", "x")}`,
      description: "Tests for unescaped dot bypass in regex patterns",
    });
  }

  return tests;
};

const analyzeResult = (
  testType: string,
  origin: string,
  allowOriginHeader: string | undefined,
  allowCredentialsHeader: string | undefined,
) => {
  if (allowOriginHeader === undefined) return undefined;

  const hasCredentials = allowCredentialsHeader?.toLowerCase() === "true";

  switch (testType) {
    case "arbitrary-origin-reflection":
      if (allowOriginHeader === origin) {
        return {
          name: "CORS Arbitrary Origin Reflection",
          description: `The server reflects any origin back in the Access-Control-Allow-Origin header. This means an attacker can make the victim's browser send requests with credentials to this endpoint from any malicious website.\n\n**Tested Origin:** \`${origin}\`\n**Server Response:** \`Access-Control-Allow-Origin: ${allowOriginHeader}\`${hasCredentials ? "\n**Credentials Allowed:** Yes (HIGH RISK)" : "\n**Credentials Allowed:** No"}`,
          severity: hasCredentials ? Severity.LOW : Severity.INFO,
        };
      }
      break;

    case "subdomain-wildcard":
      if (allowOriginHeader === origin) {
        return {
          name: "CORS Subdomain Wildcard",
          description: `The server allows requests from subdomains of the target domain. If an attacker can control or register a subdomain, they can access this endpoint.\n\n**Tested Origin:** \`${origin}\`\n**Server Response:** \`Access-Control-Allow-Origin: ${allowOriginHeader}\`${hasCredentials ? "\n**Credentials Allowed:** Yes (HIGH RISK)" : "\n**Credentials Allowed:** No"}`,
          severity: hasCredentials ? Severity.LOW : Severity.INFO,
        };
      }
      break;

    case "domain-prefix":
      if (allowOriginHeader === origin) {
        return {
          name: "CORS Domain Prefix Bypass",
          description: `The server allows origins that have the target domain as a suffix. An attacker could register a similar domain to bypass CORS.\n\n**Tested Origin:** \`${origin}\`\n**Server Response:** \`Access-Control-Allow-Origin: ${allowOriginHeader}\`${hasCredentials ? "\n**Credentials Allowed:** Yes (HIGH RISK)" : "\n**Credentials Allowed:** No"}`,
          severity: hasCredentials ? Severity.LOW : Severity.INFO,
        };
      }
      break;

    case "null-origin":
      if (allowOriginHeader === "null") {
        return {
          name: "CORS Null Origin Allowed",
          description: `The server allows the 'null' origin, which can be triggered by sandboxed iframes, data URLs, and file URLs. Attackers can exploit this to bypass CORS protections.\n\n**Tested Origin:** \`${origin}\`\n**Server Response:** \`Access-Control-Allow-Origin: ${allowOriginHeader}\`${hasCredentials ? "\n**Credentials Allowed:** Yes (HIGH RISK)" : "\n**Credentials Allowed:** No"}`,
          severity: hasCredentials ? Severity.LOW : Severity.INFO,
        };
      }
      break;

    case "underscore-bypass":
      if (allowOriginHeader === origin) {
        return {
          name: "CORS Underscore Bypass",
          description: `The server accepts origins with underscore characters that may not be properly validated. This could allow subdomain takeover attacks.\n\n**Tested Origin:** \`${origin}\`\n**Server Response:** \`Access-Control-Allow-Origin: ${allowOriginHeader}\`${hasCredentials ? "\n**Credentials Allowed:** Yes (HIGH RISK)" : "\n**Credentials Allowed:** No"}`,
          severity: hasCredentials ? Severity.LOW : Severity.INFO,
        };
      }
      break;

    case "regex-bypass":
      if (allowOriginHeader === origin) {
        return {
          name: "CORS Regex Bypass",
          description: `The server uses unescaped dots in regex patterns for origin validation. The dot character matches any character in regex, allowing bypass of origin restrictions.\n\n**Tested Origin:** \`${origin}\`\n**Server Response:** \`Access-Control-Allow-Origin: ${allowOriginHeader}\`${hasCredentials ? "\n**Credentials Allowed:** Yes (HIGH RISK)" : "\n**Credentials Allowed:** No"}`,
          severity: hasCredentials ? Severity.LOW : Severity.INFO,
        };
      }
      break;
  }

  return undefined;
};

export default defineCheck<CorsState>(({ step }) => {
  step("passiveCheck", (state, context) => {
    const { request, response } = context.target;

    if (response === undefined) {
      return done({ state });
    }

    const allowOriginHeader = response.getHeader(
      "access-control-allow-origin",
    )?.[0];
    const allowCredentialsHeader = response.getHeader(
      "access-control-allow-credentials",
    )?.[0];

    const findings = [];

    if (
      allowOriginHeader === "*" &&
      allowCredentialsHeader?.toLowerCase() === "true"
    ) {
      findings.push({
        name: "CORS Wildcard with Credentials",
        description: `The server responds with 'Access-Control-Allow-Origin: *' AND 'Access-Control-Allow-Credentials: true'. This configuration is forbidden by browsers and indicates a serious misconfiguration.\n\n**Access-Control-Allow-Origin:** \`${allowOriginHeader}\`\n**Access-Control-Allow-Credentials:** \`${allowCredentialsHeader}\`\n\nNote: Browsers will reject this combination, but it shows the server is misconfigured.`,
        severity: Severity.LOW,
        correlation: {
          requestID: request.getId(),
          locations: [],
        },
      });
    }

    if (findings.length > 0) {
      return done({ findings, state });
    }

    if (allowOriginHeader !== undefined) {
      const url = new URL(request.getUrl());

      return continueWith({
        nextStep: "activeTest",
        state: {
          currentTestIndex: 0,
          testResults: [],
          requestHost: url.hostname,
          requestScheme: url.protocol.slice(0, -1),
          originalUrl: request.getUrl(),
        },
      });
    }

    return done({ state });
  });

  step("activeTest", async (state, context) => {
    if (state === undefined) {
      return done({ state });
    }

    const originTests = createOriginTests(
      state.requestHost,
      state.requestScheme,
    );

    if (state.currentTestIndex >= originTests.length) {
      const findings = state.testResults
        .map((result) => result.finding)
        .filter((finding) => finding !== undefined)
        .map((finding) => ({
          ...finding,
          correlation: {
            requestID: context.target.request.getId(),
            locations: [],
          },
        }));

      return done({ findings, state });
    }

    const currentTest = originTests[state.currentTestIndex];
    if (currentTest === undefined) {
      return done({ state });
    }

    let maxTests: number;
    if (context.config.aggressivity === ScanAggressivity.LOW) {
      maxTests = 3;
    } else if (context.config.aggressivity === ScanAggressivity.MEDIUM) {
      maxTests = 5;
    } else {
      maxTests = originTests.length;
    }

    if (state.currentTestIndex >= maxTests) {
      return done({ state });
    }

    try {
      const spec = context.target.request.toSpec();
      spec.setHeader("Origin", currentTest.origin);

      const { response } = await context.sdk.requests.send(spec);

      const allowOriginHeader = response?.getHeader(
        "access-control-allow-origin",
      )?.[0];
      const allowCredentialsHeader = response?.getHeader(
        "access-control-allow-credentials",
      )?.[0];

      const finding = analyzeResult(
        currentTest.name,
        currentTest.origin,
        allowOriginHeader,
        allowCredentialsHeader,
      );

      const testResult: CorsTestResult = {
        testType: currentTest.name,
        allowOriginHeader,
        allowCredentialsHeader,
        finding,
      };

      return continueWith({
        nextStep: "activeTest",
        state: {
          ...state,
          currentTestIndex: state.currentTestIndex + 1,
          testResults: [...state.testResults, testResult],
        },
      });
    } catch {
      return continueWith({
        nextStep: "activeTest",
        state: {
          ...state,
          currentTestIndex: state.currentTestIndex + 1,
        },
      });
    }
  });

  return {
    metadata: {
      id: "cors-misconfig",
      name: "CORS Misconfiguration",
      description:
        "Detects CORS misconfigurations including origin reflection, wildcard bypasses, null origins, and validation bypasses",
      type: "active",
      tags: ["cors", "origin", "access-control"],
      severities: [Severity.INFO, Severity.LOW],
      aggressivity: {
        minRequests: 1,
        maxRequests: 6,
      },
    },

    initState: () => ({
      currentTestIndex: 0,
      testResults: [],
      requestHost: "",
      requestScheme: "",
      originalUrl: "",
    }),

    dedupeKey: (context) => {
      return (
        context.request.getHost() +
        context.request.getPort() +
        context.request.getPath()
      );
    },
  };
});
