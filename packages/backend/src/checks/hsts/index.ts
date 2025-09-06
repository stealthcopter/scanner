import { defineCheck, done, Severity } from "engine";

export default defineCheck<{}>(({ step }) => {
  step("checkHSTS", async (state, context) => {
    const { request, response } = context.target;
    
    if (!response) {
      return done({ state });
    }

    // Only check HTTPS requests
    if (!request.getTls()) {
      return done({ state });
    }

    const hstsHeader = response.getHeader("strict-transport-security");
    
    if (!hstsHeader || hstsHeader.length === 0) {
      const finding = {
        name: "Missing Strict-Transport-Security Header",
        description: `The application does not include a Strict-Transport-Security (HSTS) header. This header helps prevent man-in-the-middle attacks by ensuring browsers only connect to the site over HTTPS.`,
        severity: Severity.LOW,
        correlation: {
          requestID: request.getId(),
          locations: [],
        },
      };

      return done({ state, findings: [finding] });
    }

    // Check for multiple HSTS headers
    if (hstsHeader.length > 1) {
      const finding = {
        name: "Multiple Strict-Transport-Security Headers",
        description: `The application returns multiple Strict-Transport-Security headers, which may cause inconsistent behavior. Only one HSTS header should be present.`,
        severity: Severity.LOW,
        correlation: {
          requestID: request.getId(),
          locations: [],
        },
      };

      return done({ state, findings: [finding] });
    }

    // Check HSTS header value
    const hstsValue = hstsHeader[0];
    
    if (!hstsValue) {
      return done({ state });
    }
    
    // Check for max-age=0 (disables HSTS)
    if (hstsValue.includes("max-age=0")) {
      const finding = {
        name: "HSTS Disabled (max-age=0)",
        description: `The Strict-Transport-Security header has max-age=0, which disables HSTS protection. This may be intentional for testing, but should not be used in production.`,
        severity: Severity.LOW,
        correlation: {
          requestID: request.getId(),
          locations: [],
        },
      };

      return done({ state, findings: [finding] });
    }

    // Check for missing max-age
    if (!hstsValue.includes("max-age")) {
      const finding = {
        name: "Missing max-age in HSTS Header",
        description: `The Strict-Transport-Security header is missing the required max-age directive. Without max-age, the HSTS policy will not be enforced.`,
        severity: Severity.LOW,
        correlation: {
          requestID: request.getId(),
          locations: [],
        },
      };

      return done({ state, findings: [finding] });
    }

    // Check for malformed max-age
    const maxAgeMatch = hstsValue.match(/max-age\s*=\s*(\d+)/i);
    if (!maxAgeMatch) {
      const finding = {
        name: "Malformed max-age in HSTS Header",
        description: `The Strict-Transport-Security header has a malformed max-age value. The max-age directive should contain a valid number of seconds.`,
        severity: Severity.LOW,
        correlation: {
          requestID: request.getId(),
          locations: [],
        },
      };

      return done({ state, findings: [finding] });
    }

    return done({ state });
  });

  return {
    metadata: {
      id: "hsts",
      name: "Strict Transport Security (HSTS)",
      description: "Checks for proper Strict-Transport-Security header implementation to enforce HTTPS connections",
      type: "passive",
      tags: ["hsts", "security-headers", "https"],
      severities: [Severity.LOW],
      aggressivity: { minRequests: 0, maxRequests: 0 },
    },
    initState: () => ({}),
    dedupeKey: (context) =>
      context.request.getHost() + context.request.getPort() + context.request.getPath(),
    when: (context) => context.response !== undefined && context.request.getTls(),
  };
});
