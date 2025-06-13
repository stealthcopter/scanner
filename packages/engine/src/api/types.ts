import { type SDK } from "caido:plugin";
import { type Request, type Response } from "caido:utils";

export enum Severity {
  INFO = "info",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export type CheckContext = {
  request: Request;
  response?: Response;
  sdk: SDK;
  dependencies: <T = unknown>(id: string) => T;
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
  when: (context: CheckContext) => boolean;
  getState: () => unknown;
};

export type ScanType = "passive" | "active";
export type Agressivity = {
  minRequests: number;
  maxRequests: number | "Infinity";
};
export type ScanDefinition = {
  id: string;
  name: string;
  description: string;
  aggressivity: Agressivity;
  type: ScanType;
  create: (ctx: CheckContext) => ScanTask;
  dependsOn?: string[];
};

export type DefineUtils<T> = {
  step: (name: StepName, action: StepAction<T>) => void;
};
