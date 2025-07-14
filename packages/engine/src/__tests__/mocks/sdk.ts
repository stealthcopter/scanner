import {
  type Request,
  type RequestSpec,
  type RequestSpecRaw,
  type Response,
} from "caido:utils";

import { createMockRequest } from "./request";
import { MockRequestSpec } from "./request-spec";
import { createMockResponse } from "./response";
import {
  type TestRequestsSDK,
  type TestSDK,
  type TestSdkConfig,
} from "./types";

const useDefaultSendHandler = () => {
  return (spec: RequestSpec): { request: Request; response: Response } => {
    const request = createMockRequest({
      id: `mock-${Math.random().toString(36).substring(7)}`,
      host: spec.getHost(),
      port: spec.getPort(),
      tls: spec.getTls(),
      method: spec.getMethod(),
      path: spec.getPath(),
      query: spec.getQuery(),
      headers: spec.getHeaders(),
      body: spec.getBody()?.toText(),
    });

    const response = createMockResponse({
      id: `mock-${Math.random().toString(36).substring(7)}`,
      code: 200,
      headers: { "Content-Type": ["text/html"] },
      body: "<html><body>Mock response</body></html>",
    });

    return { request, response };
  };
};

const useRequests = () => {
  const create = (config: TestSdkConfig): TestRequestsSDK => {
    const sendHandler = config.sendHandler ?? useDefaultSendHandler();
    const inScopeHandler = config.inScopeHandler ?? (() => true);

    return {
      query: () => {
        throw new Error("requests.query() not implemented in test SDK");
      },

      matches: (
        _filter: string,
        _request: Request,
        _response?: Response,
      ): boolean => {
        return true;
      },

      get: (id: string) => {
        const pair = config.requests?.[id];
        if (!pair) {
          return Promise.resolve(undefined);
        }

        const request = createMockRequest(pair.request);
        const response = pair.response
          ? createMockResponse(pair.response)
          : undefined;

        return Promise.resolve({ request, response });
      },

      send: async (requestSpec: RequestSpec | RequestSpecRaw) => {
        let spec: RequestSpec;

        if (requestSpec instanceof MockRequestSpec) {
          spec = requestSpec;
        } else {
          throw new Error("Only MockRequestSpec is supported in test SDK");
        }

        const result = sendHandler(spec);
        return await Promise.resolve(result);
      },

      inScope: (request: Request | RequestSpec): boolean => {
        return inScopeHandler(request);
      },
    };
  };

  return { create };
};

const useConsole = () => {
  return {
    log: () => {},
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
  } as Console;
};

export const createTestSdk = (config: TestSdkConfig = {}): TestSDK => {
  const requests = useRequests();
  const console = useConsole();

  return {
    console,
    requests: requests.create(config),
  } as unknown as TestSDK;
};
