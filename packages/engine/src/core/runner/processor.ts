import {
  type Finding,
  type ScanCallbacks,
  type ScanContext,
  type ScanDefinition,
  type ScanTarget,
  type ScanTask,
} from "../../types";

import { type ScanOrchestrator } from "./orchestrator";

/**
 * TargetProcessor is responsible for processing a single scan target.
 */
export class TargetProcessor {
  constructor(
    private readonly target: ScanTarget,
    private readonly orchestrator: ScanOrchestrator,
  ) {}

  public async process(callbacks?: ScanCallbacks): Promise<Finding[]> {
    const allFindings: Finding[] = [];
    const context = this.createContext();

    for (const batch of this.orchestrator.batches) {
      const batchFindings = await this.processBatch(batch, context, callbacks);
      allFindings.push(...batchFindings);
    }

    return allFindings;
  }

  private async processBatch(
    batch: ScanDefinition[],
    context: ScanContext,
    callbacks?: ScanCallbacks,
  ): Promise<Finding[]> {
    const findings: Finding[] = [];

    const tasks = batch
      .filter((scan) => this.isScanApplicable(scan, context))
      .map((scan) => scan.create(context));

    let activeTasks = [...tasks];

    while (activeTasks.length > 0) {
      const nextTasks: ScanTask[] = [];
      for (const task of activeTasks) {
        const result = await task.tick();
        if (result.findings) {
          for (const finding of result.findings) {
            findings.push(finding);
            if (callbacks?.onFinding) {
              callbacks.onFinding(finding);
            }
          }
        }

        if (result.isDone) {
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

    return findings;
  }

  private createContext(): ScanContext {
    return {
      ...this.target,
      sdk: this.orchestrator.sdk,
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
    scan: ScanDefinition,
    context: ScanContext,
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
