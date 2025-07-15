import {
  type Request,
  type RequestSpec,
  type RequestSpecRaw,
  type Response,
} from "caido:utils";

export type MockRequestData = {
  id: string;
  host: string;
  port?: number;
  tls?: boolean;
  method?: string;
  path?: string;
  query?: string;
  url?: string;
  headers?: Record<string, string[]>;
  body?: string;
  createdAt?: Date;
};

export type MockResponseData = {
  id: string;
  code: number;
  headers?: Record<string, string[]>;
  body?: string;
  roundtripTime?: number;
  createdAt?: Date;
};

export type MockRequestResponsePair = {
  request: MockRequestData;
  response?: MockResponseData;
};

export type SendHandler = (spec: RequestSpec) =>
  | Promise<{
      request: Request;
      response: Response;
    }>
  | {
      request: Request;
      response: Response;
    };

export type TestSdkConfig = {
  requests?: Record<string, MockRequestResponsePair>;
  sendHandler?: SendHandler;
  inScopeHandler?: (request: Request | RequestSpec) => boolean;
};

export type TestRequestsSDK = {
  query: () => never;
  matches: (filter: string, request: Request, response?: Response) => boolean;
  get: (
    id: string,
  ) => Promise<{ request: Request; response?: Response } | undefined>;
  send: (
    request: RequestSpec | RequestSpecRaw,
  ) => Promise<{ request: Request; response: Response }>;
  inScope: (request: Request | RequestSpec) => boolean;
};

export type TestSDK = {
  requests: TestRequestsSDK;
  console: Console;
  findings: unknown;
  replay: unknown;
  projects: unknown;
  env: unknown;
  api: unknown;
  events: unknown;
  meta: unknown;
  runtime: unknown;
};
