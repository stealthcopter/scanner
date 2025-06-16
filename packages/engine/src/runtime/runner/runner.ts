import { type SDK } from "caido:plugin";

import {
  type CheckContext,
  type Finding,
  type RequestContext,
  RunnerState,
  type ScanDefinition,
  type ScanTask,
} from "../../api/types";
import { getScanBatches } from "../dependency";

export class ScanRunner {
  private readonly scans: ScanDefinition[] = [];
  private state: RunnerState = RunnerState.IDLE;

  public register(scan: ScanDefinition): void {
    if (this.state !== RunnerState.IDLE) {
      throw new Error("Cannot register scans while a run is in progress.");
    }

    if (this.scans.some((s) => s.metadata.id === scan.metadata.id)) {
      throw new Error(`Scan with id '${scan.metadata.id}' already registered`);
    }

    this.scans.push(scan);
  }

  public async run(contexts: RequestContext[], sdk: SDK): Promise<Finding[]> {
    if (this.state !== RunnerState.IDLE) {
      throw new Error("ScanRunner is already running or has been stopped.");
    }

    this.state = RunnerState.RUNNING;

    const allFindings: Finding[] = [];
    const dedupeCache = new Map<string, Set<string>>();
    const batches = getScanBatches(this.scans);

    for (const context of contexts) {
      if (this.state !== RunnerState.RUNNING) break;

      const findings = await this.processContext(
        context,
        sdk,
        batches,
        dedupeCache,
      );
      allFindings.push(...findings);
    }

    this.state = RunnerState.IDLE;
    return allFindings;
  }

  /**
   * Processes a single request context against all applicable scan batches.
   */
  private async processContext(
    context: RequestContext,
    sdk: SDK,
    batches: ScanDefinition[][],
    dedupeCache: Map<string, Set<string>>,
  ): Promise<Finding[]> {
    const contextFindings: Finding[] = [];
    const dependencyStore = new Map<string, unknown>();
    const baseCtx: CheckContext = {
      ...context,
      sdk,
      dependencies: <T = unknown>(id: string) => {
        if (!dependencyStore.has(id)) {
          throw new Error(`Dependency '${id}' not resolved yet`);
        }
        return dependencyStore.get(id) as T;
      },
    };

    for (const batch of batches) {
      if (this.state === RunnerState.STOPPED) break;

      const findings = await this.runTasksForBatch(
        batch,
        baseCtx,
        dedupeCache,
        dependencyStore,
      );
      contextFindings.push(...findings);
    }

    return contextFindings;
  }

  /**
   * Creates and runs all applicable scan tasks for a single batch.
   */
  private async runTasksForBatch(
    batch: ScanDefinition[],
    context: CheckContext,
    dedupeCache: Map<string, Set<string>>,
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

      let cache = dedupeCache.get(scanID);
      if (!cache) {
        cache = new Set<string>();
        dedupeCache.set(scanID, cache);
      }

      if (cache.has(key)) {
        return false;
      }

      cache.add(key);
      return true;
    });

    let tasks: ScanTask[] = applicableScans.map((scan) => scan.create(context));

    while (this.state === RunnerState.RUNNING && tasks.length > 0) {
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

  public getState(): RunnerState {
    return this.state;
  }

  public setState(state: RunnerState): void {
    this.state = state;
  }
}
