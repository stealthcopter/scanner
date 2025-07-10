import { defineCheck, done, Severity } from "engine";

export default defineCheck(({ step }) => {
  step("checkJsonHtmlResponse", (_, context) => {
    const response = context.target.response;
    if (!response) {
      return done();
    }

    const contentType = response.getHeader("content-type")?.[0];
    if (contentType === undefined || !contentType.includes("text/html")) {
      return done();
    }

    const body = response.getBody();
    if (!body) {
      return done();
    }

    const bodyText = body.toText();
    if (!bodyText.trim()) {
      return done();
    }

    try {
      const result = JSON.parse(bodyText);

      if (typeof result === "object" && result !== null) {
        return done({
          findings: [
            {
              name: "JSON Response with HTML Content-Type",
              description: `Response contains valid JSON data but has 'text/html' Content-Type header. This may lead to XSS attacks.`,
              severity: Severity.INFO,
              correlation: {
                requestID: context.target.request.getId(),
                locations: [],
              },
            },
          ],
        });
      }
    } catch {}
    return done();
  });

  return {
    metadata: {
      id: "json-html-response",
      name: "JSON Response with HTML Content-Type",
      description:
        "Detects responses that contain valid JSON but have text/html Content-Type header",
      type: "passive",
      tags: ["xss"],
      aggressivity: {
        minRequests: 0,
        maxRequests: 0,
      },
    },

    initState: () => ({}),
    dedupeKey: (context) => {
      return (
        context.request.getHost() +
        context.request.getPort() +
        context.request.getPath()
      );
    },
    when: (context) => {
      return (
        context.response !== undefined && context.response.getCode() === 200
      );
    },
  };
});
