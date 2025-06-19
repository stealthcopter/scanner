import type { SDK } from "caido:plugin";
import type { Request, Response } from "caido:utils";

import type { ScanRuntime } from "./runtime";

export enum JobState {
  IDLE,
  RUNNING,
  STOPPED,
}

export enum ScanStrength {
  LOW,
  MEDIUM,
  HIGH,
}

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
