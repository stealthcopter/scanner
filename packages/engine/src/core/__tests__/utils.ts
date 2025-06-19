import { type SDK } from "caido:plugin";
import { type Request, type Response } from "caido:utils";

import { type ScanContext, ScanStrength, Severity } from "../../index";
import type { RuntimeSDK } from "../../types/runtime";

export const createMockSDK = () => ({}) as unknown as SDK;

export const createBaseFinding = (
  overrides: Partial<{
    name: string;
    description: string;
    severity: Severity;
  }> = {},
) => ({
  name: "test-finding",
  description: "Test finding description",
  severity: Severity.INFO,
  ...overrides,
});

export const createBaseMetadata = (
  overrides: Partial<{
    id: string;
    name: string;
    description: string;
    tags: string[];
    aggressivity: { minRequests: number; maxRequests: number };
    type: "passive" | "active";
  }> = {},
) => ({
  id: "test-scan",
  name: "Test Scan",
  description: "Test scan description",
  tags: ["test"],
  aggressivity: { minRequests: 1, maxRequests: 1 },
  type: "passive" as const,
  ...overrides,
});

export const createMockRequest = ({
  host = "example.com",
  path = "/test",
  id = "req-123",
} = {}) =>
  ({
    getHost: () => host,
    getPath: () => path,
    getId: () => id,
  }) as unknown as Request;

export const createMockResponse = ({ id = "resp-123" } = {}) =>
  ({
    getId: () => id,
  }) as unknown as Response;

export const createScanContext = ({
  host = "example.com",
  path = "/test",
  requestId = "req-123",
  responseId = "resp-123",
  strength = ScanStrength.HIGH,
} = {}): ScanContext => ({
  request: createMockRequest({ host, path, id: requestId }),
  response: createMockResponse({ id: responseId }),
  sdk: createMockSDK(),
  runtime: {} as unknown as RuntimeSDK,
  config: { strength },
});
