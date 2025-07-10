import { type CheckOutput, type CheckTask } from "../types/check";
import { type Finding } from "../types/finding";
import { type InterruptReason, type ScanEvents } from "../types/runner";

import {
  ScanRunnableError,
  ScanRunnableErrorCode,
  ScanRunnableInterruptedError,
} from "./errors";

export type TaskExecutionResult =
  | {
      status: "done" | "continue";
      findings?: Finding[];
      output?: CheckOutput;
    }
  | {
      status: "failed";
      findings?: Finding[];
      errorCode: ScanRunnableErrorCode;
      errorMessage: string;
    };

export type TaskExecutor = {
  tickUntilDone: (task: CheckTask) => Promise<TaskExecutionResult>;
};

export const createTaskExecutor = ({
  emit,
  getInterruptReason,
}: {
  emit: <T extends keyof ScanEvents>(event: T, data: ScanEvents[T]) => void;
  getInterruptReason: () => InterruptReason | undefined;
}): TaskExecutor => {
  const tick = async (task: CheckTask): Promise<TaskExecutionResult> => {
    const interruptReason = getInterruptReason();
    if (interruptReason) {
      throw new ScanRunnableInterruptedError(interruptReason);
    }

    try {
      const result = await task.tick();

      if (result.findings) {
        for (const finding of result.findings) {
          emit("scan:finding", {
            targetRequestID: task.getTarget().request.getId(),
            checkID: task.metadata.id,
            finding,
          });
        }
      }

      return {
        findings: result.findings,
        status: result.status,
        output: result.status === "done" ? task.getOutput() : undefined,
      };
    } catch (error) {
      if (error instanceof ScanRunnableError) {
        return {
          findings: [],
          status: "failed",
          errorCode: error.code,
          errorMessage: error.message,
        };
      }

      return {
        findings: [],
        status: "failed",
        errorCode: ScanRunnableErrorCode.UNKNOWN_CHECK_ERROR,
        errorMessage:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  const tickUntilDone = async (
    task: CheckTask,
  ): Promise<TaskExecutionResult> => {
    const allFindings: Finding[] = [];

    while (true) {
      const result = await tick(task);

      if (result.findings) {
        allFindings.push(...result.findings);
      }

      if (result.status === "continue") {
        continue;
      }

      if (result.status === "done") {
        return {
          findings: allFindings,
          status: "done",
          output: result.output,
        };
      }

      if (result.status === "failed") {
        return {
          findings: allFindings,
          status: "failed",
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
        };
      }

      throw new Error(
        "Invalid status, you shouldn't ever reach this point. Please report this as a bug.",
      );
    }
  };

  return {
    tickUntilDone,
  };
};
