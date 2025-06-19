import type { Finding } from "./finding";
import type { ScanContext, ScanStrength, ScanTarget } from "./runner";
import type { JSONSerializable } from "./utils";

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
  minStrength?: ScanStrength;
};

export type ScanDefinition = {
  metadata: ScanMetadata;
  dedupeKey?: (context: ScanTarget) => string;
  when?: (context: ScanContext) => boolean;
  create: (context: ScanContext) => ScanTask;
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
  context: ScanContext,
) => Promise<StepResult<T>> | StepResult<T>;

export type Step<T> = {
  name: StepName;
  action: StepAction<T>;
};

export type StepTickResult = {
  isDone: boolean;
  findings?: Finding[];
};

export type ScanTask = {
  id: string;
  tick: () => Promise<StepTickResult>;
  getFindings: () => Finding[];
  serialize: () => string;
  getOutput: () => JSONSerializable | undefined;
};

export type RunState<T> = {
  state: T;
  nextStep: StepName;
  findings: Finding[];
};
