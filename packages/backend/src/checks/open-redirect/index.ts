import {
  continueWith,
  createUrlBypassGenerator,
  defineScan,
  done,
  findRedirection,
  ScanStrength,
  Severity,
} from "engine";

const keywords = [
  "url",
  "redirect",
  "target",
  "destination",
  "return",
  "path",
  "next",
];

const getUrlParams = (query: string): string[] => {
  const params = new URLSearchParams(query);

  // @ts-expect-error - TODO: figure out TS throwing here for .keys()
  return Array.from(params.keys()).filter((key: string) => {
    const keyLower = key.toLowerCase();
    const value = params.get(key) ?? "";

    const hasKeywordInName = keywords.some((keyword) =>
      keyLower.includes(keyword),
    );
    const hasUrlInValue =
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("/");

    return hasKeywordInName || hasUrlInValue;
  });
};

export default defineScan<{
  urlParams: string[];
}>(({ step }) => {
  step("findUrlParams", (_, context) => {
    const query = context.request.getQuery();
    const urlParams = getUrlParams(query);

    if (urlParams.length === 0) {
      return done();
    }

    return continueWith({
      nextStep: "testParam",
      state: { urlParams },
    });
  });

  step("testParam", async (state, context) => {
    if (state.urlParams.length === 0) {
      return done();
    }

    const [currentParam, ...remainingParams] = state.urlParams;
    if (currentParam === undefined) {
      return done();
    }

    const attackerHost = "example.com";
    let expectedHost: string;
    let protocol: string;

    const originalQueryForParamValue = context.request.getQuery() || "";
    context.sdk.console.log("originalQueryForParamValue", originalQueryForParamValue);
    const paramsForParamValue = new URLSearchParams(originalQueryForParamValue);
    const paramValue = paramsForParamValue.get(currentParam);
    context.sdk.console.log("paramValue", paramValue);
    if (
      paramValue &&
      (paramValue.startsWith("http://") || paramValue.startsWith("https://"))
    ) {
      try {
        const url = new URL(paramValue);
        expectedHost = url.host;
        protocol = url.protocol;
      } catch (e) {
        const host = context.request.getHost();
        const port = context.request.getPort();

        protocol = new URL(context.request.getUrl()).protocol;
        expectedHost = port === 80 || port === 443 ? host : `${host}:${port}`;
      }
    } else {
      const host = context.request.getHost();
      const port = context.request.getPort();

      protocol = new URL(context.request.getUrl()).protocol;
      expectedHost = port === 80 || port === 443 ? host : `${host}:${port}`;
    }

    let generator = createUrlBypassGenerator({
      expectedHost,
      attackerHost,
      protocol,
    });

    if (context.config.strength === ScanStrength.LOW) {
      generator = generator.limit(2);
    } else if (context.config.strength === ScanStrength.MEDIUM) {
      generator = generator.limit(5);
    }

    for (const payloadRecipe of generator) {
      const instance = payloadRecipe.generate();

      const originalQuery = context.request.getQuery() || "";
      const params = new URLSearchParams(originalQuery);
      params.set(currentParam, instance.value);
      context.sdk.console.log("params", params.toString());

      const spec = context.request.toSpec();
      spec.setQuery(params.toString());

      const { request, response } = await context.sdk.requests.send(spec);
      const responseContext = { ...context, response };

      const redirectInfo = findRedirection(responseContext);

      if (redirectInfo.hasRedirection && redirectInfo.location) {
        try {
          const redirectUrl = new URL(
            redirectInfo.location,
            context.request.getUrl(),
          );
          if (instance.validatesWith(redirectUrl)) {
            return done({
              findings: [
                {
                  name: "Open Redirect",
                  description: `Parameter \`${currentParam}\` allows ${redirectInfo.type} redirect via the \`${payloadRecipe.technique}\` technique.\n\n**Payload used:**\n\`\`\`\n${instance.value}\n\`\`\`\n\n${payloadRecipe.description}`,
                  severity: Severity.MEDIUM,
                  requestID: request.getId(),
                },
              ],
            });
          }
        } catch (e) {
          // TODO: we might wanna log this somewhere as this is definitely a interesting finding
          // Ignore invalid redirect URLs
        }
      }
    }

    return continueWith({
      nextStep: "testParam",
      state: {
        ...state,
        urlParams: remainingParams,
      },
    });
  });

  return {
    metadata: {
      id: "open-redirect",
      name: "Open Redirect",
      description:
        "Checks for open redirects using a variety of URL parser bypass techniques.",
      type: "active",
      tags: ["open-redirect"],
      aggressivity: {
        minRequests: 1,
        maxRequests: "Infinity",
      },
    },

    initState: () => ({ urlParams: [] }),
    dedupeKey: (context) => {
      return (
        context.request.getHost() +
        context.request.getPort() +
        context.request.getPath()
      );
    },
    when: (context) => {
      const query = context.request.getQuery();
      if (!query) return false;

      return getUrlParams(query).length > 0;
    },
  };
});
