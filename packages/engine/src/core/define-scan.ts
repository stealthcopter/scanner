import {
  type CheckDefinition,
  type CheckMetadata,
  type CheckOutput,
  type CheckTask,
  type DefineUtils,
  type RunState,
  type RuntimeContext,
  type ScanTarget,
  type Step,
  type StepAction,
  type StepName,
  type StepTickResult,
} from "../types";

import { CheckDefinitionError, CheckDefinitionErrorCode } from "./errors";

export const defineCheck = <T>(
  definition: (utils: DefineUtils<T>) => {
    metadata: CheckMetadata;
    initState?: () => T;
    dedupeKey?: (target: ScanTarget) => string;
    when?: (target: ScanTarget) => boolean;
    output?: (state: T, context: RuntimeContext) => CheckOutput;
  },
): CheckDefinition => {
  const steps: Map<StepName, Step<T>> = new Map();

  const step = (name: StepName, action: StepAction<T>) => {
    steps.set(name, { name, action });
  };

  const { metadata, dedupeKey, initState, when, output } = definition({ step });

  const create = (context: RuntimeContext): CheckTask => {
    if (steps.size === 0) {
      throw new CheckDefinitionError(
        "No steps defined for check",
        CheckDefinitionErrorCode.NO_STEPS_DEFINED,
      );
    }

    const initialState = initState !== undefined ? initState() : ({} as T);
    const runState: RunState<T> = {
      state: initialState,
      nextStep: steps.keys().next().value ?? undefined,
      findings: [],
    };

    const tick = async (): Promise<StepTickResult> => {
      if (runState.nextStep === undefined) {
        throw new CheckDefinitionError(
          "No next step",
          CheckDefinitionErrorCode.NO_NEXT_STEP,
        );
      }

      const step = steps.get(runState.nextStep);
      if (!step) {
        throw new CheckDefinitionError(
          `Step ${runState.nextStep} not found`,
          CheckDefinitionErrorCode.STEP_NOT_FOUND,
        );
      }

      const result = await step.action(runState.state, context);
      if (result.findings) {
        runState.findings.push(...result.findings);
      }

      switch (result.kind) {
        case "Done":
          runState.nextStep = undefined;
          if (result.state !== undefined) {
            runState.state = result.state;
          }
          return { isDone: true, findings: result.findings };
        case "Continue":
          runState.state = result.state;
          runState.nextStep = result.nextStep;
          return { isDone: false, findings: result.findings };
      }
    };

    const getOutput = (): CheckOutput => {
      if (output === undefined) {
        return undefined;
      }

      return output(runState.state, context);
    };

    return {
      metadata,
      tick,
      getFindings: () => runState.findings,
      getOutput,
    };
  };

  return {
    metadata,
    create,
    dedupeKey,
    when,
  };
};
