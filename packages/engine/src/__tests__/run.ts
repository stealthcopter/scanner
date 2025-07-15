import { type SDK } from "caido:plugin";
import { type Request, type Response } from "caido:utils";

import { createRegistry } from "../core/registry";
import { type CheckDefinition } from "../types/check";
import {
  type ExecutionHistory,
  ScanAggressivity,
  type ScanConfig,
} from "../types/runner";

import { createTestSdk } from "./mocks/sdk";
import { type MockRequestResponsePair, type SendHandler } from "./mocks/types";

export const runCheck = async (
  checkDefinition: CheckDefinition,
  requestResponsePairs: Array<{ request: Request; response?: Response }>,
  options?: {
    config?: Partial<ScanConfig>;
    sendHandler?: SendHandler;
  }
): Promise<ExecutionHistory> => {
  const fullConfig: ScanConfig = {
    aggressivity: ScanAggressivity.MEDIUM,
    inScopeOnly: false,
    concurrentChecks: 1,
    concurrentRequests: 1,
    concurrentTargets: 1,
    requestsDelayMs: 0,
    scanTimeout: 30000,
    checkTimeout: 10000,
    severities: ["info", "low", "medium", "high", "critical"],
    ...options?.config,
  };

  const requests: Record<string, MockRequestResponsePair> = {};

  for (const pair of requestResponsePairs) {
    requests[pair.request.getId()] = {
      request: {
        id: pair.request.getId(),
        host: pair.request.getHost(),
        port: pair.request.getPort(),
        tls: pair.request.getTls(),
        method: pair.request.getMethod(),
        path: pair.request.getPath(),
        query: pair.request.getQuery(),
        headers: pair.request.getHeaders(),
        body: pair.request.getBody()?.toText(),
      },
      response: pair.response
        ? {
            id: pair.response.getId(),
            code: pair.response.getCode(),
            headers: pair.response.getHeaders(),
            body: pair.response.getBody()?.toText(),
            roundtripTime: pair.response.getRoundtripTime(),
          }
        : undefined,
    };
  }

  const testSdk = createTestSdk({
    requests,
    sendHandler: options?.sendHandler,
  });

  const registry = createRegistry();
  registry.register(checkDefinition);

  const runnable = registry.create(testSdk as SDK, fullConfig);

  const requestIDs = requestResponsePairs.map((pair) => pair.request.getId());
  await runnable.run(requestIDs);

  const executionHistory = runnable.getExecutionHistory();
  return executionHistory;
};
