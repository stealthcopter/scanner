import { type SDK } from "caido:plugin";

import {
  type CheckContext,
  type Finding,
  type RequestContext,
  type ScanDefinition,
  type ScanTask,
} from "../../api/types";
import type { ParsedHtml } from "../../utils/html/types";
import { getScanBatches } from "../dependency";

import { RunnerState, type RunOptions } from "./types";

/**
 * Manages the execution of a single, complete scan run.
 */
export class ScanJob {
  private readonly batches: ScanDefinition[][];
  private readonly dedupeCache = new Map<string, Set<string>>();
  private readonly htmlCache = new Map<string, ParsedHtml>();

  constructor(
    private readonly scans: ScanDefinition[],
    private readonly contexts: RequestContext[],
    private readonly sdk: SDK,
    private readonly options: RunOptions,
    private readonly getRunnerState: () => RunnerState,
  ) {
    this.batches = getScanBatches(this.scans);
  }

  public async start(): Promise<Finding[]> {
    const allFindings: Finding[] = [];
    for (const context of this.contexts) {
      if (this.getRunnerState() !== RunnerState.RUNNING) break;

      const findings = await this.processContext(context);
      allFindings.push(...findings);
    }
    return allFindings;
  }

  private async processContext(context: RequestContext): Promise<Finding[]> {
    const contextFindings: Finding[] = [];
    const dependencyStore = new Map<string, unknown>();
    const baseCtx: CheckContext = {
      ...context,
      sdk: this.sdk,
      htmlCache: this.htmlCache,
      strength: this.options.strength,
      dependencies: <T = unknown>(id: string) => {
        if (!dependencyStore.has(id)) {
          throw new Error(`Dependency '${id}' not resolved yet`);
        }
        return dependencyStore.get(id) as T;
      },
    };

    for (const batch of this.batches) {
      if (this.getRunnerState() === RunnerState.STOPPED) break;

      const findings = await this.runTasksForBatch(
        batch,
        baseCtx,
        dependencyStore,
      );
      contextFindings.push(...findings);
    }

    return contextFindings;
  }

  private async runTasksForBatch(
    batch: ScanDefinition[],
    context: CheckContext,
    dependencyStore: Map<string, unknown>,
  ): Promise<Finding[]> {
    const batchFindings: Finding[] = [];

    const applicableScans = batch.filter((scan) => {
      if (!scan.when(context)) {
        return false;
      }

      if (!scan.dedupeKey) {
        return true;
      }

      const scanID = scan.metadata.id;
      const key = scan.dedupeKey(context);

      let cache = this.dedupeCache.get(scanID);
      if (!cache) {
        cache = new Set<string>();
        this.dedupeCache.set(scanID, cache);
      }

      if (cache.has(key)) {
        return false;
      }

      cache.add(key);
      return true;
    });

    let tasks: ScanTask[] = applicableScans.map((scan) => scan.create(context));

    while (this.getRunnerState() === RunnerState.RUNNING && tasks.length > 0) {
      const nextTasks: ScanTask[] = [];
      for (const task of tasks) {
        const { isDone, findings } = await task.tick();
        if (findings) batchFindings.push(...findings);

        if (isDone) {
          dependencyStore.set(task.id, task.getState());
        } else {
          nextTasks.push(task);
        }
      }
      tasks = nextTasks;
    }

    return batchFindings;
  }
}
