import { defineCheck, done, Severity } from "engine";

// Debug error patterns that indicate development/debugging information
const DEBUG_ERROR_PATTERNS = [
  // PHP debug errors
  /PHP Debug/i,
  /PHP Warning/i,
  /PHP Notice/i,
  /PHP Fatal error/i,
  /PHP Parse error/i,
  /PHP Strict Standards/i,
  /PHP Deprecated/i,

  // ASP.NET debug errors
  /Debug Information/i,
  /Stack Trace/i,
  /Source Error/i,
  /Exception Details/i,
  /Request Details/i,

  // Java debug errors
  /Exception in thread/i,
  /at \w+\.\w+\(/i,
  /\.java:\d+/i,

  // Python debug errors
  /Traceback \(most recent call last\)/i,
  /File ".*", line \d+/i,
  /\.py:\d+/i,

  // Ruby debug errors
  /\.rb:\d+/i,
  /NoMethodError/i,
  /ArgumentError/i,

  // Database debug errors
  /Query failed:/i,
  /SQL Error:/i,
  /Database connection failed/i,
  /Table.*doesn't exist/i,
  /Column.*doesn't exist/i,

  // Configuration debug errors
  /Configuration error/i,
  /Environment variable/i,
  /Config file not found/i,
  /Missing configuration/i,
];

export default defineCheck<unknown>(({ step }) => {
  step("checkDebugErrors", (state, context) => {
    const { response } = context.target;

    if (response === undefined) {
      return done({ state });
    }

    const body = response.getBody()?.toText();
    if (body === undefined) {
      return done({ state });
    }
    // Check for debug error patterns
    for (const pattern of DEBUG_ERROR_PATTERNS) {
      const match = body.match(pattern);
      if (match) {
        const finding = {
          name: "Debug Error Information Disclosure",
          description: `The application returned debug error information that may contain sensitive details about the application's internal structure, configuration, or development environment. This information can be valuable for attackers during reconnaissance.\n\nDiscovered error: \`\`\`\n${match[0]}\n\`\`\``,
          severity: Severity.LOW,
          correlation: {
            requestID: context.target.request.getId(),
            locations: [],
          },
        };

        return done({ state, findings: [finding] });
      }
    }

    return done({ state });
  });

  return {
    metadata: {
      id: "debug-errors",
      name: "Debug Error Information Disclosure",
      description:
        "Detects debug error messages that may leak sensitive information about the application's development environment or internal structure",
      type: "passive",
      tags: ["information-disclosure", "debug", "error-handling"],
      severities: [Severity.LOW],
      aggressivity: { minRequests: 0, maxRequests: 0 },
    },
    initState: () => ({}),
    dedupeKey: (context) =>
      context.request.getHost() +
      context.request.getPort() +
      context.request.getPath(),
    when: (context) =>
      context.response !== undefined &&
      !context.request.getPath().endsWith(".js"),
  };
});
