import { type CheckContext } from "./context";
import { type Finding } from "./finding";

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
