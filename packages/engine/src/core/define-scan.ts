import {
  type DefineUtils,
  type JSONSerializable,
  type RunState,
  type ScanContext,
  type ScanDefinition,
  type ScanMetadata,
  type ScanTarget,
  type ScanTask,
  type Step,
  type StepAction,
  type StepName,
  type StepTickResult,
} from "../types";

/**
 * Public helper used by scan authors.
 */
export const defineScan = <T>(
  definition: (utils: DefineUtils<T>) => {
    metadata: ScanMetadata;
    initState?: () => T;
    dedupeKey?: (target: ScanTarget) => string;
    when?: (context: ScanContext) => boolean;
    output?: (state: T) => JSONSerializable;
  },
): ScanDefinition => {
  const steps: Map<StepName, Step<T>> = new Map();

  const step = (name: StepName, action: StepAction<T>) => {
    steps.set(name, { name, action });
  };

  const { metadata, dedupeKey, initState, when, output } = definition({ step });

  const create = (context: ScanContext): ScanTask => {
    if (steps.size === 0) {
      throw new Error("No steps defined for scan");
    }

    const initialState = initState !== undefined ? initState() : ({} as T);
    const runState: RunState<T> = {
      state: initialState,
      nextStep: steps.keys().next().value ?? "",
      findings: [],
    };

    const tick = async (): Promise<StepTickResult> => {
      const step = steps.get(runState.nextStep);
      if (!step) {
        throw new Error(`Step ${runState.nextStep} not found`);
      }

      const result = await step.action(runState.state, context);
      if (result.findings) {
        runState.findings.push(...result.findings);
      }

      switch (result.kind) {
        case "Done":
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

    const serialize = () => {
      return JSON.stringify(runState);
    };

    const getOutput = (): JSONSerializable | undefined => {
      if (output === undefined) {
        return undefined;
      }
      return output(runState.state);
    };

    return {
      id: metadata.id,
      tick,
      serialize,
      getFindings: () => runState.findings,
      getOutput,
    };
  };

  return {
    metadata,
    dedupeKey,
    when,
    create,
  };
};
