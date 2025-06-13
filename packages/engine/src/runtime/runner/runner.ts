import {
  type CheckContext,
  type Finding,
  type ScanDefinition,
  type ScanTask,
} from "../../api/types";
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
    ctx: Omit<CheckContext, "dependencies">,
  ): Promise<Finding[]> {
    const findings: Finding[] = [];
    const batches = this.dependencyManager.getExecutionBatches(this.scans);

    const baseCtx: CheckContext = {
      ...ctx,
      dependencies: <T = unknown>(id: string) => this.dependencyStore.get<T>(id),
    };

    for (const batch of batches) {
      if (this.isPaused) break;

      let tasks: ScanTask[] = batch
        .map((scan) => scan.create(baseCtx))
        .filter((t) => t.when(baseCtx));

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

    return findings;
  }
}
