import { type SDK } from "caido:plugin";
import { type Request, type Response } from "caido:utils";

import { type ParsedHtml } from "../utils/html/types";

import { type CheckDefinition } from "./check";
import { type Finding } from "./finding";
import { type JSONSerializable } from "./utils";

export const ScanStrength = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
} as const;

export type ScanStrength = (typeof ScanStrength)[keyof typeof ScanStrength];

export type ScanRegistry = {
  register: (check: CheckDefinition) => void;
  create: (sdk: SDK, config: ScanConfig) => ScanRunnable;
};

export type ScanRunnable = {
  run: (requestIDs: string[]) => Promise<ScanResult>;
  estimate: (requestIDs: string[]) => Promise<ScanEstimateResult>;
  cancel: (reason: InterruptReason) => void;
  externalDedupeKeys: (dedupeKeys: Map<string, Set<string>>) => void;
  on: <T extends keyof ScanEvents>(
    event: T,
    callback: (data: ScanEvents[T]) => void
  ) => void;
  emit: (event: keyof ScanEvents, data: ScanEvents[keyof ScanEvents]) => void;
};

export type InterruptReason = "Cancelled" | "Timeout";
export type ScanResult =
  | {
      kind: "Finished";
      findings: Finding[];
    }
  | {
      kind: "Interrupted";
      reason: InterruptReason;
      findings: Finding[];
    }
  | {
      kind: "Error";
      error: string;
    };

export type ScanEstimateResult =
  | {
      kind: "Success";
      checksCount: number;
    }
  | {
      kind: "Error";
      error: string;
    };

export type ScanEvents = {
  "scan:started": unknown;
  "scan:finished": unknown;
  "scan:interrupted": { reason: InterruptReason };
  "scan:finding": { finding: Finding };
  "scan:check-started": { checkID: string };
  "scan:check-finished": { checkID: string };
  "scan:request-completed": {
    pendingRequestID: string;
    requestID: string;
    responseID: string;
  };
  "scan:request-pending": { pendingRequestID: string };
};

export type ScanTarget = {
  request: Request;
  response?: Response;
};

export type RuntimeContext = {
  target: ScanTarget;
  sdk: SDK;
  runtime: {
    html: {
      parse: (raw: string) => ParsedHtml;
    };
    dependencies: {
      get: (key: string) => JSONSerializable | undefined;
    };
  };
  config: ScanConfig;
};

export type ScanConfig = {
  strength: ScanStrength;
  inScopeOnly: boolean;
  concurrency: number;
  scanTimeout: number;
  checkTimeout: number;
};
