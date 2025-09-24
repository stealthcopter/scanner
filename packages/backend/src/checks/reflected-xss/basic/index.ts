import {
  continueWith,
  defineCheck,
  done,
  type ScanTarget,
  Severity,
} from "engine";
import { keyStrategy } from "../../../utils/key";

import {
  createRequestWithParameter,
  extractReflectedParameters,
  type Parameter,
} from "../../../utils";

function isExploitable(target: ScanTarget): boolean {
  const { request, response } = target;

  if (response === undefined) {
    return false;
  }

  const contentType = response.getHeader("Content-Type")?.[0]?.toLowerCase();
  if (contentType !== undefined && !contentType.includes("text/html")) {
    return false;
  }

  const method = request.getMethod().toUpperCase();
  if (!["GET", "POST"].includes(method)) {
    return false;
  }

  const responseBody = response.getBody()?.toText();
  if (responseBody === undefined || responseBody.length === 0) {
    return false;
  }

  return true;
}

type State = {
  testParams: Parameter[];
  currentPayloadIndex: number;
  wafEvadedParams: Parameter[];
  possibleWafBlocked: boolean;
};

const REFLECTION_PAYLOADS = [
  {
    payload: '"><z xxx=a()>',
    type: "waf-evasion",
    description: "Dummy tag with fictive event to avoid WAF detection",
  },
  {
    payload: '"><img src=x onerror=alert(1)>',
    type: "standard",
    description: "Standard image tag with onerror event",
  },
  {
    payload: '"><script>alert(1)</script>',
    type: "standard",
    description: "Script tag injection",
  },
  {
    payload: '"><svg onload=alert(1)>',
    type: "standard",
    description: "SVG tag with onload event",
  },
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

    const currentPayloadConfig = REFLECTION_PAYLOADS[state.currentPayloadIndex];
    if (currentPayloadConfig === undefined) {
      return done({ state });
    }

    const currentPayload = currentPayloadConfig.payload;
    const originalResponse = context.target.response;
    const originalResponseBody = originalResponse?.getBody()?.toText();

    for (const param of state.testParams) {
      const requestSpec = createRequestWithParameter(
        context,
        param,
        currentPayload,
      );
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
            if (currentPayloadConfig.type === "waf-evasion") {
              const newWafEvadedParams = [...state.wafEvadedParams, param];
              return continueWith({
                nextStep: "testPayloads",
                state: {
                  ...state,
                  currentPayloadIndex: state.currentPayloadIndex + 1,
                  wafEvadedParams: newWafEvadedParams,
                },
              });
            } else {
              return done({
                findings: [
                  {
                    name:
                      "Basic Reflected XSS in parameter '" + param.name + "'",
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
        } else if (currentPayloadConfig.type === "standard") {
          const isWafEvaded = state.wafEvadedParams.some(
            (p) => p.name === param.name && p.source === param.source,
          );

          if (isWafEvaded) {
            return done({
              findings: [
                {
                  name:
                    "Potential XSS with WAF Protection in parameter '" +
                    param.name +
                    "'",
                  description: `Parameter \`${param.name}\` in ${param.source} reflects harmless payloads but blocks XSS attempts, indicating potential WAF or input validation.`,
                  severity: Severity.MEDIUM,
                  correlation: {
                    requestID: request.getId(),
                    locations: [],
                  },
                },
              ],
              state: {
                ...state,
                possibleWafBlocked: true,
              },
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
      severities: [Severity.HIGH, Severity.MEDIUM],
      aggressivity: {
        minRequests: 0,
        maxRequests: "Infinity",
      },
    },
    dedupeKey: keyStrategy().withMethod().withHost().withPort().withPath().withQueryKeys().build(),
    initState: () => ({
      testParams: [],
      currentPayloadIndex: 0,
      wafEvadedParams: [],
      possibleWafBlocked: false,
    }),
    when: (target) => {
      return isExploitable(target);
    },
  };
});
