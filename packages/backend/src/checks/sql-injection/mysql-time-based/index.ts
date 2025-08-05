import { continueWith, defineCheck, done, Severity } from "engine";

import {
  type Parameter,
  createRequestWithParameter,
  extractParameters,
  hasParameters,
} from "../../../utils";

type State = {
  testParams: Parameter[];
  currentPayloadIndex: number;
  currentParamIndex: number;
  baselineTime: number;
};

const MYSQL_TIME_PAYLOADS = [
  " / sleep(10) ",
  "' / sleep(10) / '",
  '" / sleep(10) / "',
  " and 0 in (select sleep(10) ) -- ",
  "' and 0 in (select sleep(10) ) -- ",
  '" and 0 in (select sleep(10) ) -- ',
  " or 0 in (select sleep(10) ) -- ",
  "' or 0 in (select sleep(10) ) -- ",
  '" or 0 in (select sleep(10) ) -- ',
];

const TIME_THRESHOLD_MS = 3 * 1000 - 500;

export default defineCheck<State>(({ step }) => {
  step("findParameters", async (state, context) => {
    const testParams = extractParameters(context);

    if (testParams.length === 0) {
      return done({ state });
    }

    let baselineTime = context.target.response?.getRoundtripTime();
    if (baselineTime === undefined || baselineTime === 0) {
      const { response } = await context.sdk.requests.send(
        context.target.request.toSpec(),
      );
      if (response !== undefined) {
        baselineTime = response.getRoundtripTime();
      }
    }

    return continueWith({
      nextStep: "testPayloads",
      state: {
        ...state,
        testParams,
        currentPayloadIndex: 0,
        currentParamIndex: 0,
        baselineTime: baselineTime ?? 0,
      },
    });
  });

  step("testPayloads", async (state, context) => {
    if (
      state.testParams.length === 0 ||
      state.currentParamIndex >= state.testParams.length
    ) {
      return done({ state });
    }

    const currentParam = state.testParams[state.currentParamIndex];
    if (currentParam === undefined) {
      return done({ state });
    }

    if (state.currentPayloadIndex >= MYSQL_TIME_PAYLOADS.length) {
      const nextParamIndex = state.currentParamIndex + 1;
      if (nextParamIndex >= state.testParams.length) {
        return done({ state });
      }

      return continueWith({
        nextStep: "testPayloads",
        state: {
          ...state,
          currentParamIndex: nextParamIndex,
          currentPayloadIndex: 0,
        },
      });
    }

    const currentPayload = MYSQL_TIME_PAYLOADS[state.currentPayloadIndex];
    if (currentPayload === undefined) {
      return done({ state });
    }

    const testRequestSpec = createRequestWithParameter(
      context,
      currentParam,
      currentPayload,
    );
    const { request: testRequest, response: testResponse } =
      await context.sdk.requests.send(testRequestSpec);

    if (testResponse !== undefined) {
      const testTime = testResponse.getRoundtripTime();

      if (testTime - state.baselineTime >= TIME_THRESHOLD_MS) {
        return done({
          findings: [
            {
              name: "MySQL Time-Based SQL Injection in parameter '" + currentParam.name + "'",
              description: `Parameter \`${currentParam.name}\` in ${currentParam.source} is vulnerable to MySQL time-based SQL injection.\n\n**Payload used:**\n\`\`\`\n${currentPayload}\n\`\`\`\n\n**Timing evidence:**\n- Baseline response time: ${state.baselineTime}ms\n- Payload response time: ${testTime}ms\n- Time difference: ${testTime - state.baselineTime}ms`,
              severity: Severity.CRITICAL,
              correlation: {
                requestID: testRequest.getId(),
                locations: [],
              },
            },
          ],
          state,
        });
      }
    }

    return continueWith({
      nextStep: "testPayloads",
      state: {
        ...state,
        currentPayloadIndex: state.currentPayloadIndex + 1,
      },
    });
  });

  return {
    metadata: {
      id: "mysql-time-based-sqli",
      name: "MySQL Time-Based SQL Injection",
      description:
        "Detects MySQL-specific time-based SQL injection vulnerabilities using sleep() function",
      type: "active",
      tags: ["sqli"],
      severities: [Severity.CRITICAL],
      aggressivity: {
        minRequests: 2,
        maxRequests: MYSQL_TIME_PAYLOADS.length * 2,
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
      currentParamIndex: 0,
      baselineTime: 0,
    }),
    when: (target) => {
      return hasParameters(target);
    },
  };
});
