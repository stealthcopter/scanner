import type { SDK } from "caido:plugin";
import type { Request, Response } from "caido:utils";

import type { Finding } from "./finding";
import type { ScanRuntime } from "./runtime";

export type ScanCallbacks = {
  onFinding?: (finding: Finding) => void;
  onCheckFinished?: (checkID: string) => void;
  onRequest?: (requestID: string, responseID: string) => void;
};

export const ScanStrength = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
} as const;

export type ScanStrength = (typeof ScanStrength)[keyof typeof ScanStrength];

export type ScanTarget = {
  request: Request;
  response?: Response;
};

export type ScanContext = ScanTarget & {
  sdk: SDK;
  runtime: ScanRuntime;
  config: ScanConfig;
};

export type ScanConfig = {
  strength: ScanStrength;
};
