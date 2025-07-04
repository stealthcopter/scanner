import { defineCheck } from "./core/define-scan";
import { createRegistry } from "./core/registry";
import { ScanStrength } from "./types/runner";
import { SDK } from "caido:plugin";
import { RequestSpec } from "caido:utils";

const exampleCheck = defineCheck<{
  receivedContext: string;
  receivedState: string;
}>(({ step }) => {
  step("initial", (state, context) =>
    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        kind: "Done",
        state: {
          receivedContext: context.target.request.getUrl(),
          receivedState: state.receivedState,
        },
        findings: [
          {
            name: "Test Finding",
            description: JSON.stringify(
              context.runtime.dependencies.get("test-check-2")
            ),
            correlation: {
              requestID: "test-request-id",
              locations: [
                {
                  start: 0,
                  end: 10,
                  hint: "Test hint",
                },
              ],
            },
            severity: "high",
          },
        ],
      };
    })()
  );

  return {
    metadata: {
      id: "test-check",
      name: "Test Check",
      description: "A test check",
      tags: ["test"],
      aggressivity: { minRequests: 1, maxRequests: 5 },
      type: "passive",
      dependsOn: ["test-check-2"],
    },
    initState: () => ({
      receivedContext: "Hello",
      receivedState: "World",
    }),
  };
});

const exampleCheck2 = defineCheck<{
  receivedContext: string;
  receivedState: string;
}>(({ step }) => {
  step("initial", (state, context) =>
    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // @ts-ignore
      await context.sdk.requests.send({ url: "https://example.com" });

      return {
        kind: "Done",
        state: {
          receivedContext: context.target.request.getUrl(),
          receivedState: state.receivedState,
        },
        findings: [],
      };
    })()
  );

  return {
    metadata: {
      id: "test-check-2",
      name: "Test Check",
      description: "A test check",
      tags: ["test"],
      aggressivity: { minRequests: 1, maxRequests: 5 },
      type: "passive",
    },
    initState: () => ({
      receivedContext: "Hello",
      receivedState: "World",
    }),
    output: (state) => {
      return {
        finalState: "Hello world!",
      };
    },
  };
});

const registry = createRegistry();
registry.register(exampleCheck);
registry.register(exampleCheck2);

for (let i = 3; i <= 10; i++) {
  const check = defineCheck<{
    checkNumber: number;
    processedAt: string;
  }>(({ step }) => {
    step("initial", (state, context) =>
      (async () => {
        const sleepTime = Math.random() * 1000 + 1000;
        await new Promise((resolve) => setTimeout(resolve, sleepTime));

        return {
          kind: "Done",
          state: {
            checkNumber: i,
            processedAt: new Date().toISOString(),
          },
          findings: [
            {
              name: `Finding from Check ${i}`,
              description: `This is a finding from check number ${i}`,
              correlation: {
                requestID: `request-${i}`,
                locations: [
                  {
                    start: i * 10,
                    end: i * 10 + 5,
                    hint: `Check ${i} hint`,
                  },
                ],
              },
              severity: i % 3 === 0 ? "high" : i % 2 === 0 ? "medium" : "low",
            },
          ],
        };
      })()
    );

    return {
      metadata: {
        id: `test-check-${i}`,
        name: `Test Check ${i}`,
        description: `A test check number ${i}`,
        tags: ["test", "generated"],
        aggressivity: { minRequests: 1, maxRequests: 5 },
        type: "passive",
      },
      initState: () => ({
        checkNumber: i,
        processedAt: "",
      }),
    };
  });

  registry.register(check);
}

const mockSDK = {
  requests: {
    get: async (requestID: string) => {
      return {
        request: { getUrl: () => requestID, getId: () => requestID },
        response: {
          getBody: () => "Hello, world!",
        },
      };
    },
    send: async (request: RequestSpec) => {
      await new Promise((resolve) => setTimeout(resolve, 200));

      return {
        request: { getUrl: () => "test", getId: () => "1" },
        response: { getBody: () => "Hello, world!", getId: () => "1" },
      };
    },
  },
} as unknown as SDK;

const runnable = registry.create(mockSDK, {
  strength: ScanStrength.LOW,
  inScopeOnly: false,
  concurrency: 3,
  scanTimeout: 15 * 60 * 1000,
  checkTimeout: 2 * 60 * 1000,
});
runnable.on("scan:check-started", (data) => {
  console.log("\x1b[32mSTARTED:\x1b[0m", data.checkID);
});

runnable.on("scan:check-finished", (data) => {
  console.log("\x1b[34mFINISHED:\x1b[0m", data.checkID);
});


const result = await runnable.run(["1"]);
console.log(result);
