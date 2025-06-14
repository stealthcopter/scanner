import { continueWith, defineScan, done, type Finding, Severity } from "engine";

const getUrlParams = (query: string) => {
  const params = new URLSearchParams(query);
  return Array.from(params.keys()).filter((key) =>
    key.toLowerCase().includes("url"),
  );
};

export default defineScan<{
  urlParams: string[];
}>(({ step }) => {
  step("findUrlParams", (_, context) => {
    const query = context.request.getQuery();
    const urlParams = getUrlParams(query);

    return continueWith({
      nextStep: "checkRedirect",
      state: { urlParams },
    });
  });

  step("checkRedirect", async (state, context) => {
    const [param, ...remainingParams] = state.urlParams;
    if (!param) return done();

    const spec = context.request.toSpec();
    spec.setQuery(`${param}=${encodeURIComponent("https://example.com")}`);

    const { request, response } = await context.sdk.requests.send(spec);
    const locations = response.getHeader("Location") || [];

    const findings: Finding[] = [];
    for (const location of locations) {
      if (location.startsWith("https://example.com")) {
        findings.push({
          name: "Open Redirect",
          description: `Parameter '${param}' allows redirect to external URL: ${location}`,
          severity: Severity.HIGH,
          requestID: request.getId(),
        });
      }
    }

    if (remainingParams.length === 0) {
      return done({ findings });
    }

    return continueWith({
      nextStep: "checkRedirect",
      state: { urlParams: remainingParams },
      findings,
    });
  });

  return {
    metadata: {
      id: "open-redirect",
      name: "Open Redirect",
      description: "Check for open redirects",
      type: "active",
      tags: ["open-redirect"],
      aggressivity: {
        minRequests: 0,
        maxRequests: "Infinity",
      },
    },

    initState: () => ({ urlParams: [] }),
    when: (context) => {
      const query = context.request.getQuery();
      if (!query) return false;

      return getUrlParams(query).length > 0;
    },
  };
});
