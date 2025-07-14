import { defineCheck, done, Severity } from "engine";

export default defineCheck(({ step }) => {
  step("checkCorsHeaders", (_, context) => {
    const response = context.target.response;
    const request = context.target.request;

    if (!response) {
      return done();
    }

    const accessControlAllowOrigin = response.getHeader(
      "access-control-allow-origin",
    )?.[0];
    const accessControlAllowCredentials = response.getHeader(
      "access-control-allow-credentials",
    )?.[0];
    const requestOrigin = request.getHeader("origin")?.[0];

    if (accessControlAllowOrigin === undefined) {
      return done();
    }

    if (
      accessControlAllowOrigin === "*" &&
      accessControlAllowCredentials?.toLowerCase() === "true"
    ) {
      return done({
        findings: [
          {
            name: "CORS Wildcard Origin with Credentials",
            description: `The response contains \`Access-Control-Allow-Origin: *\` with \`Access-Control-Allow-Credentials: true\`. This configuration is forbidden by the CORS specification and allows any origin to access credentials.`,
            severity: Severity.LOW,
            correlation: {
              requestID: request.getId(),
              locations: [],
            },
          },
        ],
      });
    }

    if (accessControlAllowOrigin === "null") {
      return done({
        findings: [
          {
            name: "CORS Null Origin Allowed",
            description: `The response contains \`Access-Control-Allow-Origin: null\`. This allows requests from sandboxed iframes, data URLs, and file URLs, which can be exploited by attackers to bypass CORS protections.`,
            severity: Severity.LOW,
            correlation: {
              requestID: request.getId(),
              locations: [],
            },
          },
        ],
      });
    }

    if (
      requestOrigin !== undefined &&
      accessControlAllowOrigin !== undefined &&
      requestOrigin === accessControlAllowOrigin &&
      requestOrigin !== "*" &&
      requestOrigin !== "null"
    ) {
      return done({
        findings: [
          {
            name: "CORS Origin Reflection",
            description: `The response reflects the request's \`Origin\` header in \`Access-Control-Allow-Origin: ${accessControlAllowOrigin}\`. This may indicate that the server blindly trusts any origin, potentially allowing unauthorized cross-origin requests.`,
            severity: Severity.LOW,
            correlation: {
              requestID: request.getId(),
              locations: [],
            },
          },
        ],
      });
    }

    return done();
  });

  return {
    metadata: {
      id: "cors-misconfig",
      name: "CORS Misconfiguration",
      description:
        "Detects common CORS misconfigurations including wildcard origins, null origins, reflected origins, and overly permissive settings",
      type: "passive",
      tags: ["cors", "security-headers"],
      aggressivity: {
        minRequests: 0,
        maxRequests: 0,
      },
    },

    initState: () => ({}),
    dedupeKey: (context) => {
      return (
        context.request.getHost() +
        context.request.getPort() +
        context.request.getPath()
      );
    },
    when: (context) => {
      return (
        context.response !== undefined &&
        context.response.getHeader("access-control-allow-origin") !== undefined
      );
    },
  };
});
