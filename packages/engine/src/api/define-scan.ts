import {
  type CheckContext,
  type DefineUtils,
  type RequestContext,
  type RunState,
  type ScanDefinition,
  type ScanMetadata,
  type ScanTask,
  type Step,
  type StepAction,
  type StepName,
} from "./types";
/**
 * Public helper used by scan authors.
 */
export const defineScan = <T>(
  definition: (utils: DefineUtils<T>) => {
    metadata: ScanMetadata;
    dedupeKey?: (context: RequestContext) => string;
    initState: () => T;
    when?: (ctx: CheckContext) => boolean;
  },
): ScanDefinition => {
  const steps: Map<StepName, Step<T>> = new Map();

  const step = (name: StepName, action: StepAction<T>) => {
    steps.set(name, { name, action });
  };

  const { metadata, dedupeKey, initState, when } = definition({ step });

  const create = (context: CheckContext): ScanTask => {
    if (steps.size === 0) {
      throw new Error("No steps defined for scan");
    }

    const runState: RunState<T> = {
      state: initState(),
      nextStep: steps.keys().next().value ?? "",
      findings: [],
    };

    const tick = async () => {
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

    return {
      id: metadata.id,
      tick,
      serialize,
      getFindings: () => [...runState.findings],
      getState: () => runState.state,
    };
  };

  return {
    metadata,
    dedupeKey,
    when: when ?? (() => true),
    create,
  };
};
