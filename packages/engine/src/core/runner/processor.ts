import type { RequestResponseOpt, RequestSpec } from "caido:utils";

import {
  type CheckContext,
  type CheckDefinition,
  type Finding,
  type InterruptReason,
  type ScanTask,
} from "../../types";

import { type ScanOrchestrator } from "./orchestrator";

type ProcessorResult =
  | {
      kind: "Finished";
      findings: Finding[];
    }
  | {
      kind: "Interrupted";
      reason: InterruptReason;
    };

/**
 * TargetProcessor is responsible for processing a single scan target.
 */
export class TargetProcessor {
  private readonly target: RequestResponseOpt;
  private readonly orchestrator: ScanOrchestrator;

  constructor(target: RequestResponseOpt, orchestrator: ScanOrchestrator) {
    this.target = target;
    this.orchestrator = orchestrator;
  }

  public async process(): Promise<ProcessorResult> {
    const allFindings: Finding[] = [];
    const context = this.createContext();

    for (const batch of this.orchestrator.batches) {
      if (this.orchestrator.runner.state !== "Running") {
        return {
          kind: "Interrupted",
          reason: "Cancelled",
        };
      }

      const result = await this.processBatch(batch, context);
      if (result.kind === "Interrupted") {
        return result;
      }

      allFindings.push(...result.findings);
    }

    return {
      kind: "Finished",
      findings: allFindings,
    };
  }

  private async processBatch(
    batch: CheckDefinition[],
    context: CheckContext
  ): Promise<ProcessorResult> {
    const findings: Finding[] = [];
    const tasks = batch
      .filter((check) => this.isScanApplicable(check, context))
      .map((check) => check.create(context));

    let activeTasks = [...tasks];

    while (
      activeTasks.length > 0 &&
      this.orchestrator.runner.state === "Running"
    ) {
      const nextTasks: ScanTask[] = [];

      for (const task of activeTasks) {
        if (this.orchestrator.runner.state !== "Running") {
          return {
            kind: "Interrupted",
            reason: "Cancelled",
          };
        }

        const result = await task.tick();

        if (result.findings) {
          for (const finding of result.findings) {
            findings.push(finding);
            this.orchestrator.runner.emit("scan:finding", {
              finding,
            });
          }
        }

        if (result.isDone) {
          this.orchestrator.runner.emit("scan:check-finished", {
            checkID: task.id,
          });

          const output = task.getOutput();
          if (output !== undefined) {
            this.orchestrator.dependencyStore.set(task.id, output);
          }
        } else {
          nextTasks.push(task);
        }
      }

      activeTasks = nextTasks;
    }

    return {
      kind: "Finished",
      findings,
    };
  }

  private createContext(): CheckContext {
    // TODO: this is a hack to get the onRequest callback to work, improve it
    const wrappedSdk = {
      ...this.orchestrator.sdk,
      requests: {
        ...this.orchestrator.sdk.requests,
        send: async (request: RequestSpec) => {
          const result = await this.orchestrator.sdk.requests.send(request);
          this.orchestrator.runner.emit("scan:request", {
            requestID: result.request.getId(),
            responseID: result.response.getId(),
          });

          return result;
        },
      },
    };

    return {
      request: this.target.request,
      response: this.target.response,
      sdk: wrappedSdk,
      runtime: {
        html: {
          get: () => this.orchestrator.htmlCache.get(this.target),
        },
        dependencies: {
          get: (id: string) => this.orchestrator.dependencyStore.get(id),
        },
      },
      config: this.orchestrator.config,
    };
  }

  private isScanApplicable(
    scan: CheckDefinition,
    context: CheckContext
  ): boolean {
    const { config } = this.orchestrator;

    if (
      scan.metadata.minStrength !== undefined &&
      (config.strength === undefined ||
        config.strength < scan.metadata.minStrength)
    ) {
      return false;
    }

    if (scan.when !== undefined && !scan.when(context)) {
      return false;
    }

    if (scan.dedupeKey !== undefined) {
      const scanId = scan.metadata.id;
      const key = scan.dedupeKey(context);

      let scanCache = this.orchestrator.dedupeKeysCache.get(scanId);
      if (scanCache === undefined) {
        scanCache = new Set<string>();
        this.orchestrator.dedupeKeysCache.set(scanId, scanCache);
      }

      if (scanCache.has(key)) {
        return false;
      }

      scanCache.add(key);
    }

    return true;
  }
}
