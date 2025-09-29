import { defineCheck, done, Severity } from "engine";

import { bodyMatchesAny } from "../../utils/body";
import { keyStrategy } from "../../utils/key";

// Credit card regex patterns based on Valibot implementation
// Combined patterns for detection in text (with word boundaries and optional separators)
const CREDIT_CARD_PATTERNS = [
  // Main pattern with word boundaries and optional separators
  /\b(?:\d{14,19}|\d{4}(?:[\s-]\d{3,6}){2,4})\b/g,
  // Provider-specific patterns with word boundaries
  /\b3[47]\d{13}\b/g, // American Express
  /\b3(?:0[0-5]|[68]\d)\d{11,13}\b/g, // Diners Club
  /\b6(?:011|5\d{2})\d{12,15}\b/g, // Discover
  /\b(?:2131|1800|35\d{3})\d{11}\b/g, // JCB
  /\b(?:5[1-5]\d{2}|(?:222\d|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720))\d{12}\b/g, // Mastercard
  /\b(?:6[27]\d{14,17}|81\d{14,17})\b/g, // UnionPay
  /\b4\d{12}(?:\d{3,6})?\b/g, // Visa
];

export default defineCheck(({ step }) => {
  step("scanResponse", (state, context) => {
    const response = context.target.response;

    if (response === undefined || response.getCode() !== 200) {
      return done({ state });
    }

    // Check if the response body contains credit card patterns
    if (bodyMatchesAny(response, CREDIT_CARD_PATTERNS)) {
      return done({
        findings: [
          {
            name: "Credit Card Number Disclosed",
            description:
              "Credit card numbers have been detected in the response. This sensitive financial information should not be exposed in web responses.",
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
      id: "credit-card-disclosure",
      name: "Credit Card Number Disclosed",
      description: "Detects credit card numbers in HTTP responses",
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
