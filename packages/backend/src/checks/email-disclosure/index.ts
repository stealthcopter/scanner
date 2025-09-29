import { defineCheck, done, Severity } from "engine";

import { bodyMatchesAny } from "../../utils/body";
import { keyStrategy } from "../../utils/key";

// Email address regex pattern
const EMAIL_PATTERNS = [
  // Taken from https://colinhacks.com/essays/reasonable-email-regex
  /(?!\.)(?!.*\.\.)([a-z0-9_'+\-.]*)[a-z0-9_'+-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}/,
];

export default defineCheck(({ step }) => {
  step("scanResponse", (state, context) => {
    const response = context.target.response;

    if (response === undefined || response.getCode() !== 200) {
      return done({ state });
    }

    // Check if the response body contains email patterns
    if (bodyMatchesAny(response, EMAIL_PATTERNS)) {
      return done({
        findings: [
          {
            name: "Email Address Disclosed",
            description: "Email addresses have been detected in the response.",
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
