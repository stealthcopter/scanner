import {
  type Agressivity,
  type CheckContext,
  type DefineUtils,
  type RunState,
  type ScanDefinition,
  type ScanTask,
  type ScanType,
  type Step,
  type StepAction,
  type StepName,
} from "./types";

/**
 * Public helper used by scan authors.
 */
export const defineScan = <T>(
  definition: (utils: DefineUtils<T>) => {
    id: string;
    name: string;
    description: string;
    aggressivity: Agressivity;
    type: ScanType;
    dependsOn?: string[];

    initState: () => T;
    when: (ctx: CheckContext) => boolean;
  },
): ScanDefinition => {
  const steps: Map<StepName, Step<T>> = new Map();

  const step = (name: StepName, action: StepAction<T>) => {
    steps.set(name, { name, action });
  };

  const {
    id,
    name,
    description,
    aggressivity,
    type,
    dependsOn,

    initState,
    when,
  } = definition({ step });

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
      id,
      tick,
      serialize,
      when,
      getFindings: () => [...runState.findings],
      getState: () => runState.state,
    };
  };

  return { id, name, description, aggressivity, type, dependsOn, create };
};
