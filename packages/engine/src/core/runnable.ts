import { PromisePool } from "@supercharge/promise-pool";
import { batchingToposort } from "batching-toposort-ts";
import { type SDK } from "caido:plugin";
import mitt from "mitt";

import {
  ScanRunnableError,
  ScanRunnableErrorCode,
  ScanRunnableInterruptedError,
  ScanRuntimeError,
} from "../core/errors";
import { type CheckDefinition, type CheckOutput } from "../types/check";
import { type Finding } from "../types/finding";
import {
  type InterruptReason,
  type RuntimeContext,
  type ScanConfig,
  type ScanEstimateResult,
  type ScanEvents,
  type ScanResult,
  type ScanRunnable,
  type ScanTarget,
} from "../types/runner";
import { parseHtmlFromString } from "../utils/html/parser";

import { createTaskExecutor } from "./execution";

export const createRunnable = ({
  sdk,
  checks,
  config,
}: {
  sdk: SDK;
  checks: CheckDefinition[];
  config: ScanConfig;
}): ScanRunnable => {
  const { on, emit } = mitt<ScanEvents>();
  const batches = getCheckBatches(checks);
  const findings: Finding[] = [];
  const dependencies = new Map<string, CheckOutput>();
  let dedupeKeys = new Map<string, Set<string>>();
  let interruptReason: InterruptReason | undefined;
  let hasRun = false;

  const createDedupeKeysSnapshot = (): Map<string, Set<string>> => {
    const snapshot = new Map<string, Set<string>>();
    for (const [checkId, keySet] of dedupeKeys) {
      snapshot.set(checkId, new Set(keySet));
    }
    return snapshot;
  };

  const externalDedupeKeys = (externalDedupeKeys: Map<string, Set<string>>) => {
    if (hasRun) {
      throw new ScanRunnableError(
        "Cannot set dedupe keys after scan has started",
        ScanRunnableErrorCode.SCAN_ALREADY_RUNNING,
      );
    }
    dedupeKeys = externalDedupeKeys;
  };

  const isCheckApplicable = (
    check: CheckDefinition,
    context: RuntimeContext,
    targetDedupeKeys: Map<string, Set<string>> = dedupeKeys,
  ): boolean => {
    if (
      check.metadata.minAggressivity !== undefined &&
      check.metadata.minAggressivity > context.config.aggressivity
    ) {
      return false;
    }

    if (check.when !== undefined && !check.when(context.target)) {
      return false;
    }

    if (check.dedupeKey !== undefined) {
      const checkId = check.metadata.id;
      const key = check.dedupeKey(context.target);

      let checkCache = targetDedupeKeys.get(checkId);
      if (checkCache === undefined) {
        checkCache = new Set<string>();
        targetDedupeKeys.set(checkId, checkCache);
      }

      if (checkCache.has(key)) {
        return false;
      }

      checkCache.add(key);
    }

    return true;
  };

  const createRuntimeContext = (
    target: ScanTarget,
    sdk: SDK,
  ): RuntimeContext => {
    return {
      target,
      config,
      sdk,
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
  };

  const taskExecutor = createTaskExecutor({
    emit,
    getInterruptReason: () => interruptReason,
  });

  const processBatch = async (
    batch: CheckDefinition[],
    context: RuntimeContext,
  ): Promise<void> => {
    const tasks = batch
      .filter((check) => isCheckApplicable(check, context))
      .map((check) => check.create(context));

    const { errors } = await PromisePool.for(tasks)
      .withConcurrency(context.config.concurrency)
      .withTaskTimeout(context.config.checkTimeout * 1000)
      .handleError((error, _, pool) => {
        if (error instanceof ScanRunnableInterruptedError) {
          pool.stop();
          return;
        }

        throw error;
      })
      .onTaskFinished((task) => {
        emit("scan:check-finished", {
          checkID: task.metadata.id,
          targetRequestID: context.target.request.getId(),
        });
      })
      .onTaskStarted((task) => {
        emit("scan:check-started", {
          checkID: task.metadata.id,
          targetRequestID: context.target.request.getId(),
        });
      })
      .process(async (task) => {
        context.activeCheckID = task.metadata.id;

        const result = await taskExecutor.tickUntilDone(task);
        if (result.findings) {
          findings.push(...result.findings);
        }

        if (result.status === "done") {
          dependencies.set(task.metadata.id, result.output);
        }

        if (result.status === "failed") {
          emit("scan:check-failed", {
            checkID: task.metadata.id,
            targetRequestID: context.target.request.getId(),
            errorCode: result.errorCode,
            errorMessage: result.errorMessage,
          });
        }

        return result;
      });

    if (errors.length > 0) {
      throw new ScanRuntimeError(errors);
    }
  };

  return {
    run: async (requestIDs: string[]): Promise<ScanResult> => {
      if (hasRun) {
        return { kind: "Error", error: "Scan is already running" };
      }

      const runScan = async (): Promise<ScanResult> => {
        try {
          hasRun = true;
          emit("scan:started", {});

          for (const requestID of requestIDs) {
            const target = await sdk.requests.get(requestID);
            if (target === undefined) {
              throw new ScanRunnableError(
                `Request ${requestID} not found`,
                ScanRunnableErrorCode.REQUEST_NOT_FOUND,
              );
            }

            const wrappedSdk = {
              ...sdk,
              requests: {
                ...sdk.requests,
                send: async (request) => {
                  if (context.activeCheckID === undefined) {
                    throw new ScanRunnableError(
                      "No active check ID. You should never reach this state, please report this as a bug.",
                      ScanRunnableErrorCode.NO_ACTIVE_CHECK_ID,
                    );
                  }

                  const pendingRequestID = Math.random()
                    .toString(36)
                    .substring(2, 15);
                  emit("scan:request-pending", {
                    pendingRequestID,
                    targetRequestID: requestID,
                    checkID: context.activeCheckID,
                  });

                  try {
                    const result = await sdk.requests.send(request);
                    emit("scan:request-completed", {
                      pendingRequestID,
                      requestID: result.request.getId(),
                      responseID: result.response.getId(),
                      checkID: context.activeCheckID,
                      targetRequestID: requestID,
                    });
                    return result;
                  } catch (error) {
                    const errorMessage =
                      error instanceof Error ? error.message : "Unknown error";

                    emit("scan:request-failed", {
                      pendingRequestID,
                      error: errorMessage,
                      targetRequestID: requestID,
                      checkID: context.activeCheckID,
                    });

                    throw new ScanRunnableError(
                      `Request ID: ${requestID} failed: ${errorMessage}`,
                      ScanRunnableErrorCode.REQUEST_FAILED,
                    );
                  }
                },
              },
            } as SDK;

            const context = createRuntimeContext(
              {
                request: target.request,
                response: target.response,
              },
              wrappedSdk,
            );

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

          return {
            kind: "Error",
            error: error instanceof Error ? error.message : "Unknown error",
          };
        } finally {
          emit("scan:finished", {});
        }
      };

      if (config.scanTimeout > 0) {
        const timeoutPromise = new Promise<ScanResult>((resolve) => {
          setTimeout(() => {
            if (!interruptReason) {
              interruptReason = "Timeout";
            }
            resolve({ kind: "Interrupted", reason: "Timeout", findings });
          }, config.scanTimeout * 1000);
        });

        return Promise.race([runScan(), timeoutPromise]);
      } else {
        return runScan();
      }
    },
    estimate: async (requestIDs: string[]): Promise<ScanEstimateResult> => {
      let checksTotal = 0;
      const snapshotDedupeKeys = createDedupeKeysSnapshot();
      for (const requestID of requestIDs) {
        const target = await sdk.requests.get(requestID);
        if (target === undefined) {
          return { kind: "Error", error: `Request ${requestID} not found` };
        }

        const context = createRuntimeContext(
          {
            request: target.request,
            response: target.response,
          },
          sdk,
        );

        const tasks = batches.map((batch) =>
          batch.filter((check) =>
            isCheckApplicable(check, context, snapshotDedupeKeys),
          ),
        );

        checksTotal += tasks.flat().length;
      }

      return { kind: "Success", checksTotal };
    },
    cancel: async (reason) => {
      if (interruptReason || !hasRun) {
        return;
      }

      interruptReason = reason;
      await new Promise<void>((resolve) => {
        on("scan:interrupted", () => resolve());
      });
    },
    externalDedupeKeys: externalDedupeKeys,
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
            `Check '${check.metadata.id}' has unknown dependency '${dependencyId}'`,
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
    }),
  );
};
