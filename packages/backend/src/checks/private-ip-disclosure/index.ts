import { defineCheck, done, Severity } from "engine";

import { bodyMatchesAny } from "../../utils/body";
import { keyStrategy } from "../../utils/key";

// Private IP address regex patterns
const PRIVATE_IP_PATTERNS = [
  // RFC 1918 Private IP ranges
  // 10.0.0.0/8 (10.0.0.0 to 10.255.255.255)
  /\b10\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,

  // 172.16.0.0/12 (172.16.0.0 to 172.31.255.255)
  /\b172\.(1[6-9]|2[0-9]|3[0-1])\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,

  // 192.168.0.0/16 (192.168.0.0 to 192.168.255.255)
  /\b192\.168\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,

  // Link-local addresses (169.254.0.0/16)
  /\b169\.254\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,

  // Loopback addresses (127.0.0.0/8)
  /\b127\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
];

export default defineCheck(({ step }) => {
  step("scanResponse", (state, context) => {
    const response = context.target.response;

    if (response === undefined || response.getCode() !== 200) {
      return done({ state });
    }

    // Check if the response body contains private IP patterns
    if (bodyMatchesAny(response, PRIVATE_IP_PATTERNS)) {
      return done({
        findings: [
          {
            name: "Private IP Address Disclosed",
            description:
              "Private IP addresses have been detected in the response. Exposing internal network infrastructure details can aid attackers in network reconnaissance and lateral movement.",
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
      id: "private-ip-disclosure",
      name: "Private IP Address Disclosed",
      description:
        "Detects private IP addresses in HTTP responses that could reveal internal network infrastructure",
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
