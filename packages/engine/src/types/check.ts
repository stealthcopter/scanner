import { type Finding } from "./finding";
import {
  type RuntimeContext,
  type ScanStrength,
  type ScanTarget,
} from "./runner";
import { type JSONSerializable } from "./utils";

export type CheckAggressivity = {
  minRequests: number;
  maxRequests: number | "Infinity";
};

export type CheckType = "passive" | "active";
export type CheckMetadata = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  aggressivity: CheckAggressivity;
  type: CheckType;
  dependsOn?: string[];
  minStrength?: ScanStrength;
};

export type CheckDefinition = {
  metadata: CheckMetadata;
  dedupeKey?: (target: ScanTarget) => string;
  when?: (target: ScanTarget) => boolean;
  create: (context: RuntimeContext) => CheckTask;
};

export type DefineUtils<T> = {
  step: (name: StepName, action: StepAction<T>) => void;
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
  context: RuntimeContext,
) => Promise<StepResult<T>> | StepResult<T>;

export type Step<T> = {
  name: StepName;
  action: StepAction<T>;
};

export type StepTickResult = {
  status: "done" | "continue";
  findings?: Finding[];
};

export type CheckTask = {
  metadata: CheckMetadata;
  tick: () => Promise<StepTickResult>;
  getFindings: () => Finding[];
  getOutput: () => CheckOutput;
  getTarget: () => ScanTarget;
};

export type RunState<T> = {
  state: T;
  nextStep: StepName | undefined;
  findings: Finding[];
};

export type CheckOutput = JSONSerializable | undefined;
