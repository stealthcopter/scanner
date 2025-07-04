import { PromisePool } from "@supercharge/promise-pool";
import { batchingToposort } from "batching-toposort-ts";
import { type SDK } from "caido:plugin";
import mitt from "mitt";

import {
  ScanRunnableError,
  ScanRunnableErrorCode,
  ScanRunnableInterruptedError,
} from "../core/errors";
import { type CheckDefinition, type CheckOutput } from "../types/check";
import { type Finding } from "../types/finding";
import {
  type InterruptReason,
  type RuntimeContext,
  type ScanEvents,
  type ScanRunnable,
  type ScanTarget,
} from "../types/runner";
import { parseHtmlFromString } from "../utils/html/parser";

import { createTaskExecutor } from "./execution";

export const createRunnable = ({
  sdk,
  checks,
  context: createContext,
}: {
  sdk: SDK;
  checks: CheckDefinition[];
  context: (target: ScanTarget) => Omit<RuntimeContext, "runtime">;
}): ScanRunnable => {
  const { on, emit } = mitt<ScanEvents>();
  const batches = getCheckBatches(checks);
  const findings: Finding[] = [];
  const dedupeKeys = new Map<string, Set<string>>();
  const dependencies = new Map<string, CheckOutput>();
  let hasRun = false;

  let interruptReason: InterruptReason | undefined;

  const isCheckApplicable = (
    check: CheckDefinition,
    context: RuntimeContext
  ): boolean => {
    if (
      check.metadata.minStrength !== undefined &&
      check.metadata.minStrength > context.config.strength
    ) {
      return false;
    }

    if (check.when !== undefined && !check.when(context.target)) {
      return false;
    }

    if (check.dedupeKey !== undefined) {
      const checkId = check.metadata.id;
      const key = check.dedupeKey(context.target);

      let checkCache = dedupeKeys.get(checkId);
      if (checkCache === undefined) {
        checkCache = new Set<string>();
        dedupeKeys.set(checkId, checkCache);
      }

      if (checkCache.has(key)) {
        return false;
      }

      checkCache.add(key);
    }

    return true;
  };

  const taskExecutor = createTaskExecutor({
    emit,
    getInterruptReason: () => interruptReason,
  });

  const processBatch = async (
    batch: CheckDefinition[],
    context: RuntimeContext
  ): Promise<void> => {
    const tasks = batch
      .filter((check) => isCheckApplicable(check, context))
      .map((check) => check.create(context));

    const { errors } = await PromisePool.for(tasks)
      .withConcurrency(context.config.concurrency)
      .withTaskTimeout(context.config.checkTimeout)
      .handleError((error, _, pool) => {
        if (error instanceof ScanRunnableInterruptedError) {
          pool.stop();
          return;
        }

        throw error;
      })
      .onTaskFinished((task) => {
        emit("scan:check-finished", { checkID: task.metadata.id });
      })
      .onTaskStarted((task) => {
        emit("scan:check-started", { checkID: task.metadata.id });
      })
      .process(async (task) => {
        const result = await taskExecutor.executeUntilDone(task);

        if (result.findings) {
          findings.push(...result.findings);
        }

        if (result.output !== undefined) {
          dependencies.set(task.metadata.id, result.output);
        }

        return result;
      });

    if (errors.length > 0) {
      throw errors[0];
    }
  };

  return {
    async run(requestIDs: string[]) {
      if (hasRun) {
        throw new ScanRunnableError(
          "Scan is either currently running or has been run before. Please create another runnable instance to run a new scan.",
          ScanRunnableErrorCode.SCAN_ALREADY_RUNNING
        );
      }

      try {
        hasRun = true;
        emit("scan:started", {});

        for (const requestID of requestIDs) {
          const target = await sdk.requests.get(requestID);
          if (target === undefined) {
            throw new ScanRunnableError(
              `Request ${requestID} not found`,
              ScanRunnableErrorCode.REQUEST_NOT_FOUND
            );
          }

          const context: RuntimeContext = {
            ...createContext({
              request: target.request,
              response: target.response,
            }),
            runtime: {
              html: {
                parse: (raw: string) => {
                  return parseHtmlFromString(raw);
                },
              },
              dependencies: {
                get: (key: string) => {
                  return dependencies.get(key);
                },
              },
            },
          };

          const originalSend = context.sdk.requests.send;
          context.sdk.requests.send = async (request) => {
            const id = generateId();
            emit("scan:request-pending", {
              id,
            });

            const result = await originalSend(request);
            emit("scan:request-completed", {
              id,
              requestID: result.request.getId(),
              responseID: result.response.getId(),
            });
            return result;
          };

          for (const batch of batches) {
            if (interruptReason) {
              throw new ScanRunnableInterruptedError(interruptReason);
            }

            await processBatch(batch, context);
          }
        }

        return { kind: "Finished", findings };
      } catch (error) {
        if (error instanceof ScanRunnableInterruptedError) {
          emit("scan:interrupted", { reason: error.reason });
          return { kind: "Interrupted", reason: error.reason, findings };
        }

        return { kind: "Error", error: error as string };
      } finally {
        emit("scan:finished", {});
      }
    },
    cancel: (reason) => {
      interruptReason = reason;
    },
    on: (event, callback) => on(event, callback),
    emit: (event, data) => emit(event, data),
  };
};

const getCheckBatches = (checks: CheckDefinition[]): CheckDefinition[][] => {
  const checkMap = new Map(checks.map((check) => [check.metadata.id, check]));
  const dag: Record<string, string[]> = {};

  for (const check of checks) {
    dag[check.metadata.id] = [];
  }

  for (const check of checks) {
    const dependencies = check.metadata.dependsOn;
    if (dependencies) {
      for (const dependencyId of dependencies) {
        if (!checkMap.has(dependencyId)) {
          throw new Error(
            `Check '${check.metadata.id}' has unknown dependency '${dependencyId}'`
          );
        }
        if (!dag[dependencyId]) {
          dag[dependencyId] = [];
        }
        dag[dependencyId].push(check.metadata.id);
      }
    }
  }

  const batches = batchingToposort(dag);
  return batches.map((batch) =>
    batch.map((checkId) => {
      const check = checkMap.get(checkId);
      if (!check) {
        throw new Error(`Check '${checkId}' not found in checkMap`);
      }
      return check;
    })
  );
};

const generateId = () => {
  return Math.random().toString(36).substring(2, 15);
};
