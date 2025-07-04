import { type CheckOutput, type CheckTask } from "../types/check";
import { type Finding } from "../types/finding";
import { type InterruptReason, type ScanEvents } from "../types/runner";

import { ScanRunnableInterruptedError } from "./errors";

export type TaskExecutionResult = {
  findings?: Finding[];
  isDone: boolean;
  output?: CheckOutput;
};

export type TaskExecutor = {
  execute: (task: CheckTask) => Promise<TaskExecutionResult>;
  executeUntilDone: (task: CheckTask) => Promise<TaskExecutionResult>;
};

export const createTaskExecutor = ({
  emit,
  getInterruptReason,
}: {
  emit: (event: keyof ScanEvents, data: ScanEvents[keyof ScanEvents]) => void;
  getInterruptReason: () => InterruptReason | undefined;
}): TaskExecutor => {
  const execute = async (task: CheckTask): Promise<TaskExecutionResult> => {
    const interruptReason = getInterruptReason();
    if (interruptReason) {
      throw new ScanRunnableInterruptedError(interruptReason);
    }

    const result = await task.tick();

    if (result.findings) {
      for (const finding of result.findings) {
        emit("scan:finding", { finding });
      }
    }

    return {
      findings: result.findings,
      isDone: result.isDone,
      output: result.isDone ? task.getOutput() : undefined,
    };
  };

  const executeUntilDone = async (
    task: CheckTask,
  ): Promise<TaskExecutionResult> => {
    const allFindings: Finding[] = [];
    let finalOutput: CheckOutput | undefined;

    while (true) {
      const result = await execute(task);

      if (result.findings) {
        allFindings.push(...result.findings);
      }

      if (result.isDone) {
        finalOutput = result.output;
        break;
      }
    }

    return {
      findings: allFindings,
      isDone: true,
      output: finalOutput,
    };
  };

  return {
    execute,
    executeUntilDone,
  };
};
