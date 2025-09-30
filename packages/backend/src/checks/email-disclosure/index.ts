import { defineCheck, done, Severity } from "engine";

import { extractBodyMatches } from "../../utils/body";
import { keyStrategy } from "../../utils/key";

// Email address regex pattern
const EMAIL_PATTERNS = [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g];

export default defineCheck(({ step }) => {
  step("scanResponse", (state, context) => {
    const response = context.target.response;

    if (response === undefined || response.getCode() !== 200) {
      return done({ state });
    }

    const matches = extractBodyMatches(response, EMAIL_PATTERNS);

    if (matches.length > 0) {
      const matchedEmails = matches.map((email) => `- ${email}`).join("\n");

      return done({
        findings: [
          {
            name: "Email Address Disclosed",
            description: `Email addresses have been detected in the response. \n\nDiscovered email addresses:\n\`\`\`\n${matchedEmails}\n\`\`\``,
            severity: Severity.INFO,
            correlation: {
              requestID: context.target.request.getId(),
              locations: [],
            },
          },
        ],
        state,
      });
    }

    return done({ state });
  });

  return {
    metadata: {
      id: "email-disclosure",
      name: "Email Address Disclosed",
      description:
        "Detects email addresses in HTTP responses that could be used for phishing or spam",
      type: "passive",
      tags: ["information-disclosure", "sensitive-data"],
      severities: [Severity.INFO],
      aggressivity: {
        minRequests: 0,
        maxRequests: 0,
      },
    },

    initState: () => ({}),
    dedupeKey: keyStrategy().withHost().withPort().withPath().build(),
  };
});
