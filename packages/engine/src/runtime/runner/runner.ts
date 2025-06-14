import {
  type CheckContext,
  type Finding,
  type RequestContext,
  type ScanDefinition,
  type ScanTask,
} from "../../api/types";
import { type SDK } from "caido:plugin";
import { DependencyManager } from "../dependency/manager";
import { DependencyStore } from "../dependency/store";

export class ScanRunner {
  private readonly scans: ScanDefinition[] = [];
  private readonly dependencyManager = new DependencyManager();
  private isPaused = false;

  public register(scan: ScanDefinition): void {
    if (this.scans.some((s) => s.id === scan.id)) {
      throw new Error(`Scan with id '${scan.id}' already registered`);
    }
    this.scans.push(scan);
  }

  public async run(
    contexts: RequestContext[],
    sdk: SDK,
  ): Promise<Finding[]> {
    const allFindings: Finding[] = [];
    const batches = this.dependencyManager.getExecutionBatches(this.scans);
    const dedupeCache = new Map<string, Set<string>>();

    for (const context of contexts) {
      if (this.isPaused) break;

      const dependencyStore = new DependencyStore();
      const baseCtx: CheckContext = {
        ...context,
        sdk,
        dependencies: <T = unknown>(id: string) => dependencyStore.get<T>(id),
      };

      for (const batch of batches) {
        if (this.isPaused) break;

        const applicableScans = batch.filter((scan) => {
          if (!scan.when(baseCtx)) {
            return false;
          }

          if (scan.dedupeKey) {
            const key = scan.dedupeKey(context);
            if (!dedupeCache.has(scan.id)) {
              dedupeCache.set(scan.id, new Set<string>());
            }

            if (dedupeCache.get(scan.id)!.has(key)) {
              return false;
            }

            dedupeCache.get(scan.id)!.add(key);
          }

          return true;
        });

        let tasks: ScanTask[] = applicableScans.map((scan) =>
          scan.create(baseCtx),
        );

        while (!this.isPaused && tasks.length > 0) {
          const next: ScanTask[] = [];
          for (const task of tasks) {
            const { isDone } = await task.tick();

            if (isDone) {
              const taskFindings = task.getFindings();
              allFindings.push(...taskFindings);
              dependencyStore.set(task.id, task.getState());
            } else {
              next.push(task);
            }
          }
          tasks = next;
        }
      }
    }

    return allFindings;
  }

  public async runSingle(
    ctx: RequestContext,
    sdk: SDK,
  ): Promise<Finding[]> {
    return this.run([ctx], sdk);
  }
}
