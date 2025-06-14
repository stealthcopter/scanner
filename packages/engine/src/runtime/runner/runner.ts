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
  private readonly dependencyStore = new DependencyStore();
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
    const findings: Finding[] = [];
    const batches = this.dependencyManager.getExecutionBatches(this.scans);
    const dedupeCache = new Map<string, Set<string>>();

    for (const context of contexts) {
      if (this.isPaused) break;

      const baseCtx: CheckContext = {
        ...context,
        sdk,
        dependencies: <T = unknown>(id: string) =>
          this.dependencyStore.get<T>(id),
      };

      for (const batch of batches) {
        if (this.isPaused) break;

        let tasks: ScanTask[] = [];

        for (const scan of batch) {
          const task = scan.create(baseCtx);
          if (!task.when(baseCtx)) continue;

          if (scan.dedupeKey) {
            const key = scan.dedupeKey(context);
            if (!dedupeCache.has(scan.id)) {
              dedupeCache.set(scan.id, new Set<string>());
            }
            if (dedupeCache.get(scan.id)!.has(key)) {
              continue;
            }
            dedupeCache.get(scan.id)!.add(key);
          }

          tasks.push(task);
        }

        while (!this.isPaused && tasks.length) {
          const next: ScanTask[] = [];

          for (const task of tasks) {
            const { isDone } = await task.tick();

            if (isDone) {
              findings.push(...task.getFindings());
              this.dependencyStore.set(task.id, task.getState());
            } else {
              next.push(task);
            }
          }

          tasks = next;
        }
      }
    }

    return findings;
  }

  public async runSingle(
    ctx: RequestContext,
    sdk: SDK,
  ): Promise<Finding[]> {
    return this.run([ctx], sdk);
  }
}
