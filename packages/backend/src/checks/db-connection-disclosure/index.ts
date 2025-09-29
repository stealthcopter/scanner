import { defineCheck, done, Severity } from "engine";

import { bodyMatchesAny } from "../../utils/body";
import { keyStrategy } from "../../utils/key";

// Database connection string regex patterns
const DB_CONNECTION_PATTERNS = [
  // MySQL connection strings
  /mysql:\/\/[^:\s]+:[^@\s]+@[^/\s]+\/[^\s]+/gi,
  /mysql:\/\/[^@\s]+@[^/\s]+\/[^\s]+/gi,

  // PostgreSQL connection strings
  /postgresql:\/\/[^:\s]+:[^@\s]+@[^/\s]+\/[^\s]+/gi,
  /postgres:\/\/[^:\s]+:[^@\s]+@[^/\s]+\/[^\s]+/gi,
  /postgresql:\/\/[^@\s]+@[^/\s]+\/[^\s]+/gi,
  /postgres:\/\/[^@\s]+@[^/\s]+\/[^\s]+/gi,

  // MongoDB connection strings
  /mongodb:\/\/[^:\s]+:[^@\s]+@[^/\s]+\/[^\s]+/gi,
  /mongodb\+srv:\/\/[^:\s]+:[^@\s]+@[^/\s]+\/[^\s]+/gi,
  /mongodb:\/\/[^@\s]+@[^/\s]+\/[^\s]+/gi,
  /mongodb\+srv:\/\/[^@\s]+@[^/\s]+\/[^\s]+/gi,

  // SQL Server connection strings
  /Server=[^;]+;Database=[^;]+;User Id=[^;]+;Password=[^;]+/gi,
  /Data Source=[^;]+;Initial Catalog=[^;]+;User ID=[^;]+;Password=[^;]+/gi,

  // Oracle connection strings
  /oracle:\/\/[^:\s]+:[^@\s]+@[^/\s]+\/[^\s]+/gi,
  /oracle:\/\/[^@\s]+@[^/\s]+\/[^\s]+/gi,

  // Redis connection strings
  /redis:\/\/[^:\s]+:[^@\s]+@[^/\s]+/gi,
  /redis:\/\/[^@\s]+@[^/\s]+/gi,

  // Generic database connection patterns
  /(?:database|db|connection|conn)_(?:url|string|uri|host|user|password|pass|pwd)\s*[=:]\s*[^\s]+/gi,
  /(?:DATABASE|DB|CONNECTION|CONN)_(?:URL|STRING|URI|HOST|USER|PASSWORD|PASS|PWD)\s*[=:]\s*[^\s]+/gi,

  // Connection string patterns with credentials
  /(?:user|username|uid)\s*[=:]\s*[^;,\s]+[;,\s]+(?:password|pwd|pass)\s*[=:]\s*[^;,\s]+/gi,
  /(?:password|pwd|pass)\s*[=:]\s*[^;,\s]+[;,\s]+(?:user|username|uid)\s*[=:]\s*[^;,\s]+/gi,

  // JDBC connection strings
  /jdbc:[^:]+:[^;]+;user=[^;]+;password=[^;]+/gi,
  /jdbc:[^:]+:[^;]+;password=[^;]+;user=[^;]+/gi,
];

export default defineCheck(({ step }) => {
  step("scanResponse", (state, context) => {
    const response = context.target.response;

    if (response === undefined || response.getCode() !== 200) {
      return done({ state });
    }

    // Check if the response body contains database connection patterns
    if (bodyMatchesAny(response, DB_CONNECTION_PATTERNS)) {
      return done({
        findings: [
          {
            name: "Database Connection String Disclosed",
            description:
              "Database connection strings have been detected in the response. Exposed database credentials can lead to unauthorized database access.",
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
      id: "db-connection-disclosure",
      name: "Database Connection String Disclosed",
      description:
        "Detects database connection strings in HTTP responses that could lead to unauthorized database access",
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
