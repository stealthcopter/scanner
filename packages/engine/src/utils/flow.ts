import { type Finding, type StepName, type StepResult } from "../types";

type ContinueParams<T> = {
  nextStep: StepName;
  state: T;
  findings?: Finding[];
};

/**
 * Creates a result that continues the scan to the next step.
 */
export const continueWith = <T>(params: ContinueParams<T>): StepResult<T> => {
  return {
    kind: "Continue",
    nextStep: params.nextStep,
    state: params.state,
    findings: params.findings,
  };
};

type DoneParams<T> = {
  findings?: Finding[];
  state: T;
};

/**
 * Creates a result that finishes the current scan task.
 */
export const done = <T>(params: DoneParams<T>): StepResult<T> => {
  return {
    kind: "Done",
    findings: params?.findings,
    state: params?.state,
  };
};
