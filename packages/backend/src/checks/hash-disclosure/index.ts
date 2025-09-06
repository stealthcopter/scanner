import { defineCheck, done, Severity } from "engine";

// Common hash patterns
const HASH_PATTERNS = [
  // MD5 (32 hex characters)
  { pattern: /[a-fA-F0-9]{32}/g, name: "MD5", severity: Severity.MEDIUM },
  
  // SHA-1 (40 hex characters)
  { pattern: /[a-fA-F0-9]{40}/g, name: "SHA-1", severity: Severity.MEDIUM },
  
  // SHA-256 (64 hex characters)
  { pattern: /[a-fA-F0-9]{64}/g, name: "SHA-256", severity: Severity.MEDIUM },
  
  // SHA-512 (128 hex characters)
  { pattern: /[a-fA-F0-9]{128}/g, name: "SHA-512", severity: Severity.MEDIUM },
  
  // bcrypt (starts with $2a$, $2b$, $2y$)
  { pattern: /\$2[aby]\$\d{2}\$[a-zA-Z0-9./]{53}/g, name: "bcrypt", severity: Severity.HIGH },
  
  // Argon2 (starts with $argon2)
  { pattern: /\$argon2[di]d?\$v=\d+\$m=\d+,t=\d+,p=\d+\$[a-zA-Z0-9+/]+\$[a-zA-Z0-9+/]+/g, name: "Argon2", severity: Severity.HIGH },
  
  // PBKDF2 (starts with $pbkdf2)
  { pattern: /\$pbkdf2[^$]+\$[a-zA-Z0-9+/]+/g, name: "PBKDF2", severity: Severity.HIGH },
  
  // scrypt (starts with $scrypt)
  { pattern: /\$scrypt\$[a-zA-Z0-9+/]+/g, name: "scrypt", severity: Severity.HIGH },
  
  // NTLM (starts with $NT$ or $LM$)
  { pattern: /\$(NT|LM)\$[a-fA-F0-9]{32}/g, name: "NTLM", severity: Severity.HIGH },
  
  // Apache htpasswd (starts with $apr1$)
  { pattern: /\$apr1\$[a-zA-Z0-9./]{8}\$[a-zA-Z0-9./]{22}/g, name: "Apache htpasswd", severity: Severity.HIGH },
  
  // PHP password_hash (starts with $2y$)
  { pattern: /\$2y\$\d{2}\$[a-zA-Z0-9./]{53}/g, name: "PHP password_hash", severity: Severity.HIGH },
];

// Common hash-like patterns that are likely false positives
const FALSE_POSITIVE_PATTERNS = [
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // UUIDs
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // GUIDs
  /^[0-9a-f]{8}$/i, // Short hex strings (likely not hashes)
  /^[0-9a-f]{16}$/i, // 16-char hex strings (likely not hashes)
];

export default defineCheck<{}>(({ step }) => {
  step("checkHashDisclosure", async (state, context) => {
    const { response } = context.target;
    
    if (!response) {
      return done({ state });
    }

    const body = response.getBody()?.toText();
    if (!body) {
      return done({ state });
    }

    const findings = [];

    for (const hashType of HASH_PATTERNS) {
      const matches = body.match(hashType.pattern);
      if (matches) {
        for (const match of matches) {
          // Skip if it's likely a false positive
          if (FALSE_POSITIVE_PATTERNS.some(pattern => pattern.test(match))) {
            continue;
          }

          const finding = {
            name: `${hashType.name} Hash Disclosure`,
            description: `A ${hashType.name} hash was found in the response. This may indicate that password hashes or other sensitive cryptographic data is being exposed. If these are password hashes, they could be cracked offline to obtain the original passwords.`,
            severity: hashType.severity,
            correlation: {
              requestID: context.target.request.getId(),
              locations: [],
            },
          };

          findings.push(finding);
        }
      }
    }

    if (findings.length > 0) {
      return done({ state, findings });
    }

    return done({ state });
  });

  return {
    metadata: {
      id: "hash-disclosure",
      name: "Hash Disclosure",
      description: "Detects exposed cryptographic hashes that may indicate password hash disclosure or other sensitive data exposure",
      type: "passive",
      tags: ["hash", "password", "information-disclosure", "cryptography"],
      severities: [Severity.HIGH, Severity.MEDIUM],
      aggressivity: { minRequests: 0, maxRequests: 0 },
    },
    initState: () => ({}),
    dedupeKey: (context) =>
      context.request.getHost() + context.request.getPort() + context.request.getPath(),
    when: (context) => context.response !== undefined,
  };
});
