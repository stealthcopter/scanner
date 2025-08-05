export type UrlBypassTechnique =
  | "NormalUrl"
  | "UserInfoBypass"
  | "EncodedSlashUserInfoBypass"
  | "DoubleEncodedSlashUserInfoBypass"
  | "FragmentBypass"
  | "EncodedFragmentBypass"
  | "SchemeRelative"
  | "BackslashPrefix"
  | "UnescapedRegexDot"
  | "Base64Bypass"
  | "ContainsBypass";

export type UrlBypassGeneratorConfig = {
  expectedHost: string;
  attackerHost: string;
  originalValue: string;
  protocol: string;
};

export type PayloadInstance = {
  value: string;
  validatesWith: (redirectUrl: URL) => boolean;
};

export type Payload = {
  readonly technique: UrlBypassTechnique;
  readonly description: string;
  readonly generate: () => PayloadInstance;
  readonly when?: () => boolean;
};

type BypassStrategy = (config: UrlBypassGeneratorConfig) => Payload;

export type UrlBypassGenerator = Iterable<Payload> & {
  only(...techniques: UrlBypassTechnique[]): UrlBypassGenerator;
  except(...techniques: UrlBypassTechnique[]): UrlBypassGenerator;
  limit(max: number): UrlBypassGenerator;
};

// We want to keep the most common techniques at the top of the list because some checks will use .limit(n)
const STRATEGIES: Readonly<Record<UrlBypassTechnique, BypassStrategy>> = {
  NormalUrl: ({ attackerHost, protocol }) => ({
    technique: "NormalUrl",
    description: "Uses a plain URL with the attacker host.",
    generate: () => ({
      value: `${protocol}//${attackerHost}/`,
      validatesWith: (url) => url.hostname.endsWith(attackerHost),
    }),
  }),
  UserInfoBypass: ({ expectedHost, attackerHost, protocol }) => ({
    technique: "UserInfoBypass",
    description: "Uses the @ symbol to treat the expected host as userinfo.",
    generate: () => ({
      value: `${protocol}//${expectedHost}@${attackerHost}/`,
      validatesWith: (url) => url.hostname.endsWith(attackerHost),
    }),
  }),
  SchemeRelative: ({ attackerHost }) => ({
    technique: "SchemeRelative",
    description:
      "Uses a scheme-relative URL, which may be treated as an external domain.",
    generate: () => ({
      value: `//${attackerHost}/`,
      validatesWith: (url) => url.hostname.endsWith(attackerHost),
    }),
  }),
  EncodedSlashUserInfoBypass: ({ expectedHost, attackerHost, protocol }) => ({
    technique: "EncodedSlashUserInfoBypass",
    description: "Uses a URL-encoded slash (%2F) before the @ symbol.",
    generate: () => ({
      value: `${protocol}//${expectedHost}%2f@${attackerHost}/`,
      validatesWith: (url) => url.hostname.endsWith(attackerHost),
    }),
  }),
  DoubleEncodedSlashUserInfoBypass: ({
    expectedHost,
    attackerHost,
    protocol,
  }) => ({
    technique: "DoubleEncodedSlashUserInfoBypass",
    description: "Uses a double-URL-encoded slash (%252F) before the @ symbol.",
    generate: () => ({
      value: `${protocol}//${expectedHost}%252f@${attackerHost}/`,
      validatesWith: (url) => url.hostname.endsWith(attackerHost),
    }),
  }),
  FragmentBypass: ({ expectedHost, attackerHost, protocol }) => ({
    technique: "FragmentBypass",
    description:
      "Uses a fragment (#) to mask the intended host from some parsers.",
    generate: () => ({
      value: `${protocol}//${attackerHost}#${expectedHost}/`,
      validatesWith: (url) => url.hostname.endsWith(attackerHost),
    }),
  }),
  EncodedFragmentBypass: ({ expectedHost, attackerHost, protocol }) => ({
    technique: "EncodedFragmentBypass",
    description: "Uses a URL-encoded fragment (%23) to mask the intended host.",
    generate: () => ({
      value: `${protocol}//${attackerHost}%23${expectedHost}/`,
      validatesWith: (url) => url.hostname.endsWith(attackerHost),
    }),
  }),
  BackslashPrefix: ({ expectedHost, attackerHost, protocol }) => ({
    technique: "BackslashPrefix",
    description: "Uses backslashes, which some parsers interpret differently.",
    generate: () => ({
      value: `${protocol}//${attackerHost}\\@${expectedHost}/`,
      validatesWith: (url) => url.hostname.endsWith(attackerHost),
    }),
  }),
  // TODO: this will not work as expected for TLDs with more than one dot like ".com.uk"
  UnescapedRegexDot: ({ expectedHost, protocol }) => ({
    technique: "UnescapedRegexDot",
    description:
      "Replaces a dot with a different character to trick weak regex.",
    when: () => expectedHost.split(".").length > 2,
    generate: () => {
      const lastDotIndex = expectedHost.lastIndexOf(
        ".",
        expectedHost.lastIndexOf(".") - 1,
      );
      const maliciousHost =
        expectedHost.substring(0, lastDotIndex) +
        "x" +
        expectedHost.substring(lastDotIndex + 1);
      return {
        value: `${protocol}//${maliciousHost}/`,
        validatesWith: (url) => url.host === maliciousHost,
      };
    },
  }),
  Base64Bypass: ({ attackerHost, protocol }) => ({
    technique: "Base64Bypass",
    description: "Uses a base64 encoded string to bypass the expected host.",
    generate: () => {
      return {
        value: btoa(`${protocol}//${attackerHost}/`),
        validatesWith: (url) => url.hostname === attackerHost,
      };
    },
  }),
  ContainsBypass: ({ attackerHost, protocol, originalValue }) => ({
    technique: "ContainsBypass",
    description:
      "Uses a payload that contains the original value but redirects to the attacker host.",
    generate: () => ({
      value: `${protocol}//${attackerHost}/?${originalValue}`,
      validatesWith: (url) => url.hostname.includes(attackerHost),
    }),
  }),
};

export function createUrlBypassGenerator(input: {
  expectedHost: string;
  attackerHost: string;
  originalValue: string;
  protocol?: string;
}): UrlBypassGenerator {
  const config: UrlBypassGeneratorConfig = {
    protocol: "https:",
    ...input,
  };

  // Basic validation to prevent bugs in the future
  if (config.expectedHost.includes("/") || config.attackerHost.includes("/")) {
    throw new Error("Expected a valid hostname, not a URL");
  }

  if (!config.protocol.endsWith(":")) {
    throw new Error("Protocol must end with a colon");
  }

  const ALL_TECHNIQUES = Object.keys(STRATEGIES) as UrlBypassTechnique[];

  const createGenerator = (
    activeTechniques: UrlBypassTechnique[],
  ): UrlBypassGenerator => {
    return {
      *[Symbol.iterator]() {
        for (const technique of activeTechniques) {
          const strategy = STRATEGIES[technique];
          const payloadRecipe = strategy(config);

          if (payloadRecipe.when === undefined || payloadRecipe.when()) {
            yield payloadRecipe;
          }
        }
      },
      only(...techniques: UrlBypassTechnique[]): UrlBypassGenerator {
        const newActive = activeTechniques.filter((t) =>
          techniques.includes(t),
        );
        return createGenerator(newActive);
      },
      except(...techniques: UrlBypassTechnique[]): UrlBypassGenerator {
        const newActive = activeTechniques.filter(
          (t) => !techniques.includes(t),
        );
        return createGenerator(newActive);
      },
      limit(max: number): UrlBypassGenerator {
        return createGenerator(activeTechniques.slice(0, max));
      },
    };
  };

  return createGenerator(ALL_TECHNIQUES);
}
