import { type SDK } from "caido:plugin";
import { type Request, type Response } from "caido:utils";

import type { ParsedHtml } from "../utils/html/types";

export enum Severity {
  INFO = "info",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export type RequestContext = {
  request: Request;
  response?: Response;
};

export type CheckContext = RequestContext & {
  sdk: SDK;
  dependencies: <T = unknown>(id: string) => T;
  htmlCache: Map<string, ParsedHtml>;
};

export type Finding = {
  name: string;
  description: string;
  severity: Severity;
  requestID?: string;
};

export type StepName = string;
export type StepResult<T> =
  | {
      kind: "Done";
      findings?: Finding[];
      state?: T;
    }
  | {
      kind: "Continue";
      nextStep: StepName;
      state: T;
      findings?: Finding[];
    };

export type StepAction<T> = (
  state: T,
  context: CheckContext,
) => Promise<StepResult<T>> | StepResult<T>;

export type Step<T> = {
  name: StepName;
  action: StepAction<T>;
};

export type RunState<T> = {
  state: T;
  nextStep: StepName;
  findings: Finding[];
};

export type ScanTask = {
  id: string;
  tick: () => Promise<{ isDone: boolean; findings?: Finding[] }>;
  getFindings: () => Finding[];
  serialize: () => string;
  getState: () => unknown;
};

export type Agressivity = {
  minRequests: number;
  maxRequests: number | "Infinity";
};

export type ScanType = "passive" | "active";
export type ScanMetadata = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  aggressivity: Agressivity;
  type: ScanType;
  dependsOn?: string[];
};

export type ScanDefinition = {
  metadata: ScanMetadata;
  dedupeKey?: (context: RequestContext) => string;
  when: (context: CheckContext) => boolean;
  create: (ctx: CheckContext) => ScanTask;
};

export type DefineUtils<T> = {
  step: (name: StepName, action: StepAction<T>) => void;
};

export enum RunnerState {
  IDLE,
  RUNNING,
  STOPPED,
}
