import {
  continueWith,
  createUrlBypassGenerator,
  defineScan,
  done,
  Severity,
} from "engine";

type ScanState = {
  urlParams: string[];
};

const getUrlParams = (query: string): string[] => {
  const params = new URLSearchParams(query);
  const keywords = ["url", "redirect", "target", "destination", "return"];

  // @ts-expect-error - TODO: figure out TS throwing here for .keys()
  return Array.from(params.keys()).filter((key: string) =>
    keywords.some((keyword) => key.toLowerCase().includes(keyword)),
  );
};

export default defineScan<ScanState>(({ step }) => {
  step("findUrlParams", (_, context) => {
    const query = context.request.getQuery();
    const urlParams = getUrlParams(query);

    if (urlParams.length === 0) {
      return done();
    }

    return continueWith({
      nextStep: "testRedirectPayloads",
      state: { urlParams },
    });
  });

  step("testRedirectPayloads", async (state, context) => {
    const attackerHost = "example.com";

    const host = context.request.getHost();
    const port = context.request.getPort();
    const protocol = new URL(context.request.getUrl()).protocol;
    const expectedHost = port === 80 || port === 443 ? host : `${host}:${port}`;

    const generator = createUrlBypassGenerator({
      expectedHost,
      attackerHost,
      protocol,
    });

    for (const param of state.urlParams) {
      for (const payloadRecipe of generator) {
        const instance = payloadRecipe.generate();

        const spec = context.request.toSpec();
        spec.setQuery(`${param}=${encodeURIComponent(instance.value)}`);

        const { request, response } = await context.sdk.requests.send(spec);
        const locations = response.getHeader("Location") || [];

        for (const location of locations) {
          try {
            const redirectUrl = new URL(location, context.request.getUrl());
            if (instance.validatesWith(redirectUrl)) {
              return done({
                findings: [
                  {
                    name: "Open Redirect",
                    description: `Parameter '${param}' allows redirect via the '${payloadRecipe.technique}' technique.\nPayload used: ${instance.value}\n${payloadRecipe.description}`,
                    severity: Severity.MEDIUM,
                    requestID: request.getId(),
                  },
                ],
              });
            }
          } catch (e) {
            // Ignore invalid Location headers (TODO: we may want to log this somewhere as this is definitely interesting behavior)
          }
        }
      }
    }

    return done();
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
