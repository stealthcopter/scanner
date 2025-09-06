import { defineCheck, done, Severity } from "engine";

export default defineCheck<{}>(({ step }) => {
  step("checkCSP", async (state, context) => {
    const { response } = context.target;
    
    if (!response) {
      return done({ state });
    }

    // Only check HTML responses
    const contentType = response.getHeader("content-type")?.[0] || "";
    if (!contentType.includes("text/html")) {
      return done({ state });
    }

    const cspHeader = response.getHeader("content-security-policy");
    const findings = [];

    if (!cspHeader || cspHeader.length === 0) {
      const finding = {
        name: "Missing Content Security Policy",
        description: `The application does not include a Content Security Policy (CSP) header. CSP helps prevent Cross-Site Scripting (XSS) attacks by controlling which resources can be loaded and executed.`,
        severity: Severity.MEDIUM,
        correlation: {
          requestID: context.target.request.getId(),
          locations: [],
        },
      };

      return done({ state, findings: [finding] });
    }

    // Check for multiple CSP headers
    if (cspHeader.length > 1) {
      const finding = {
        name: "Multiple Content Security Policy Headers",
        description: `The application returns multiple Content Security Policy headers, which may cause inconsistent behavior. Only one CSP header should be present.`,
        severity: Severity.LOW,
        correlation: {
          requestID: context.target.request.getId(),
          locations: [],
        },
      };

      findings.push(finding);
    }

    // Analyze CSP policy
    const cspValue = cspHeader[0];
    
    if (!cspValue) {
      return done({ state });
    }
    
    // Check for unsafe-inline in script-src
    if (cspValue.includes("script-src") && cspValue.includes("'unsafe-inline'")) {
      const finding = {
        name: "CSP: Unsafe Inline Scripts",
        description: `The Content Security Policy allows 'unsafe-inline' for scripts, which significantly reduces protection against Cross-Site Scripting (XSS) attacks. Consider using nonces or hashes instead.`,
        severity: Severity.MEDIUM,
        correlation: {
          requestID: context.target.request.getId(),
          locations: [],
        },
      };

      findings.push(finding);
    }

    // Check for unsafe-eval in script-src
    if (cspValue.includes("script-src") && cspValue.includes("'unsafe-eval'")) {
      const finding = {
        name: "CSP: Unsafe Eval",
        description: `The Content Security Policy allows 'unsafe-eval' for scripts, which permits the use of eval() and similar functions. This can increase the risk of XSS attacks.`,
        severity: Severity.MEDIUM,
        correlation: {
          requestID: context.target.request.getId(),
          locations: [],
        },
      };

      findings.push(finding);
    }

    // Check for wildcard (*) in script-src
    if (cspValue.includes("script-src") && cspValue.includes("*")) {
      const finding = {
        name: "CSP: Wildcard in Script Source",
        description: `The Content Security Policy uses a wildcard (*) in script-src, which allows scripts to be loaded from any domain. This significantly reduces protection against XSS attacks.`,
        severity: Severity.MEDIUM,
        correlation: {
          requestID: context.target.request.getId(),
          locations: [],
        },
      };

      findings.push(finding);
    }

    // Check for missing object-src
    if (!cspValue.includes("object-src")) {
      const finding = {
        name: "CSP: Missing object-src Directive",
        description: `The Content Security Policy is missing the object-src directive. Without this directive, the browser will fall back to default-src, which may allow unwanted object/embed/applet elements.`,
        severity: Severity.LOW,
        correlation: {
          requestID: context.target.request.getId(),
          locations: [],
        },
      };

      findings.push(finding);
    }

    // Check for missing base-uri
    if (!cspValue.includes("base-uri")) {
      const finding = {
        name: "CSP: Missing base-uri Directive",
        description: `The Content Security Policy is missing the base-uri directive. Without this directive, the browser will fall back to default-src, which may allow base tag injection attacks.`,
        severity: Severity.LOW,
        correlation: {
          requestID: context.target.request.getId(),
          locations: [],
        },
      };

      findings.push(finding);
    }

    if (findings.length > 0) {
      return done({ state, findings });
    }

    return done({ state });
  });

  return {
    metadata: {
      id: "csp-analysis",
      name: "Content Security Policy Analysis",
      description: "Analyzes Content Security Policy headers for potential security issues and misconfigurations",
      type: "passive",
      tags: ["csp", "security-headers", "xss", "content-security-policy"],
      severities: [Severity.MEDIUM, Severity.LOW],
      aggressivity: { minRequests: 0, maxRequests: 0 },
    },
    initState: () => ({}),
    dedupeKey: (context) =>
      context.request.getHost() + context.request.getPort() + context.request.getPath(),
    when: (context) => context.response !== undefined,
  };
});
