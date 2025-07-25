import { continueWith, defineCheck, done, Severity } from "engine";

import {
  buildTestRequest,
  extractReflectedParameters,
  isExploitable,
} from "../utils";

type State = {
  testParams: TestParam[];
  currentPayloadIndex: number;
};

type ParamSource = "query" | "body" | "header";
type TestParam = {
  name: string;
  originalValue: string;
  source: ParamSource;
};

const REFLECTION_PAYLOADS = [
  '"><img src=x onerror=alert(1)>',
  '"><script>alert(1)</script>',
  '"><svg onload=alert(1)>',
];

export default defineCheck<State>(({ step }) => {
  step("findParameters", (state, context) => {
    const testParams = extractReflectedParameters(context);

    if (testParams.length === 0) {
      return done({ state });
    }

    return continueWith({
      nextStep: "testPayloads",
      state: {
        ...state,
        testParams,
        currentPayloadIndex: 0,
      },
    });
  });

  step("testPayloads", async (state, context) => {
    if (
      state.testParams.length === 0 ||
      state.currentPayloadIndex >= REFLECTION_PAYLOADS.length
    ) {
      return done({ state });
    }

    const currentPayload = REFLECTION_PAYLOADS[state.currentPayloadIndex];
    if (currentPayload === undefined) {
      return done({ state });
    }

    const originalResponse = context.target.response;
    const originalResponseBody = originalResponse?.getBody()?.toText();

    for (const param of state.testParams) {
      const requestSpec = buildTestRequest(context, param, currentPayload);
      const { request, response } =
        await context.sdk.requests.send(requestSpec);

      if (response !== undefined) {
        const responseBody = response.getBody()?.toText();
        if (
          responseBody !== undefined &&
          responseBody.includes(currentPayload)
        ) {
          const originalReflectionCount =
            originalResponseBody !== undefined
              ? originalResponseBody.split(currentPayload).length - 1
              : 0;
          const newReflectionCount =
            responseBody.split(currentPayload).length - 1;

          if (newReflectionCount > originalReflectionCount) {
            return done({
              findings: [
                {
                  name: "Basic Reflected XSS",
                  description: `Parameter \`${param.name}\` in ${param.source} reflects XSS payload without proper encoding.\n\n**Payload used:**\n\`\`\`\n${currentPayload}\n\`\`\``,
                  severity: Severity.HIGH,
                  correlation: {
                    requestID: request.getId(),
                    locations: [],
                  },
                },
              ],
              state,
            });
          }
        }
      }
    }

    const nextPayloadIndex = state.currentPayloadIndex + 1;
    if (nextPayloadIndex >= REFLECTION_PAYLOADS.length) {
      return done({
        findings: [],
        state: {
          ...state,
          currentPayloadIndex: nextPayloadIndex,
        },
      });
    }

    return continueWith({
      nextStep: "testPayloads",
      state: {
        ...state,
        currentPayloadIndex: nextPayloadIndex,
      },
    });
  });

  return {
    metadata: {
      id: "basic-reflected-xss",
      name: "Basic Reflected Cross-Site Scripting",
      description:
        "Detects basic reflected Cross-Site Scripting vulnerabilities",
      type: "active",
      tags: ["xss"],
      severities: [Severity.HIGH],
      aggressivity: {
        minRequests: 1,
        maxRequests: REFLECTION_PAYLOADS.length,
      },
    },
    dedupeKey: (context) => {
      const query = context.request.getQuery();
      const paramKeys =
        query !== ""
          ? Array.from(new URLSearchParams(query).keys()).sort().join(",")
          : "";

      return (
        context.request.getMethod() +
        context.request.getHost() +
        context.request.getPort() +
        context.request.getPath() +
        paramKeys
      );
    },
    initState: () => ({
      testParams: [],
      currentPayloadIndex: 0,
    }),
    when: (target) => {
      return isExploitable(target);
    },
  };
});
