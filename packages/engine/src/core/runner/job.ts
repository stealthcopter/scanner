import { type SDK } from "caido:plugin";

import {
  type Finding,
  JobState,
  type ScanConfig,
  type ScanContext,
  type ScanDefinition,
  type ScanTarget,
  type ScanTask,
} from "../../types";
import { getScanBatches } from "../batcher";
import { DependencyStore, HtmlCache } from "../runtime";

export class ScanJob {
  private readonly batches: ScanDefinition[][];
  private readonly htmlCache = new HtmlCache();
  private readonly dedupeCache = new Map<string, Set<string>>();
  private state: JobState = JobState.IDLE;

  constructor(
    private readonly scans: ScanDefinition[],
    private readonly targets: ScanTarget[],
    private readonly sdk: SDK,
    private readonly config: ScanConfig,
  ) {
    this.batches = getScanBatches(this.scans);
  }

  public async start(): Promise<Finding[]> {
    const allFindings: Finding[] = [];
    this.state = JobState.RUNNING;

    for (const target of this.targets) {
      if (!this.isRunning()) break;

      const findings = await this.processTarget(target);
      allFindings.push(...findings);
    }

    return allFindings;
  }

  public stop(): void {
    this.state = JobState.STOPPED;
  }

  private async processTarget(target: ScanTarget): Promise<Finding[]> {
    const findings: Finding[] = [];
    const dependencyStore = new DependencyStore();
    const context = {
      ...target,
      sdk: this.sdk,
      runtime: {
        html: {
          _cache: this.htmlCache.cache,
          get: () => this.htmlCache.get(target),
        },
        dependencies: {
          get: (id: string) => dependencyStore.get(id),
        },
      },
      config: this.config,
    };

    for (const batch of this.batches) {
      if (!this.isRunning()) break;

      const batchFindings = await this.processBatch(
        batch,
        context,
        dependencyStore,
      );
      findings.push(...batchFindings);
    }

    return findings;
  }

  private async processBatch(
    batch: ScanDefinition[],
    context: ScanContext,
    dependencyStore: DependencyStore,
  ): Promise<Finding[]> {
    const applicableScans = this.getApplicableScans(batch, context);
    const tasks = applicableScans.map((scan) => scan.create(context));

    const findings: Finding[] = [];
    let activeTasks = [...tasks];

    while (this.isRunning() && activeTasks.length > 0) {
      const nextTasks: ScanTask[] = [];

      for (const task of activeTasks) {
        const result = await task.tick();
        if (result.findings) {
          findings.push(...result.findings);
        }

        if (result.isDone) {
          const output = task.getOutput();
          if (output !== undefined) {
            dependencyStore.set(task.id, output);
          }
        } else {
          nextTasks.push(task);
        }
      }

      activeTasks = nextTasks;
    }

    return findings;
  }

  private isRunning(): boolean {
    return this.state === JobState.RUNNING;
  }

  private getApplicableScans(
    scans: ScanDefinition[],
    context: ScanContext,
  ): ScanDefinition[] {
    return scans.filter((scan) => this.isScanApplicable(scan, context));
  }

  private isScanApplicable(
    scan: ScanDefinition,
    context: ScanContext,
  ): boolean {
    if (
      scan.metadata.minStrength !== undefined &&
      this.config.strength < scan.metadata.minStrength
    ) {
      return false;
    }

    if (scan.when !== undefined && !scan.when(context)) {
      return false;
    }

    if (!this.passesDeduplication(scan, context)) {
      return false;
    }

    return true;
  }

  private passesDeduplication(
    scan: ScanDefinition,
    context: ScanContext,
  ): boolean {
    if (!scan.dedupeKey) {
      return true;
    }

    const scanId = scan.metadata.id;
    const key = scan.dedupeKey(context);

    let scanCache = this.dedupeCache.get(scanId);
    if (!scanCache) {
      scanCache = new Set<string>();
      this.dedupeCache.set(scanId, scanCache);
    }

    if (scanCache.has(key)) {
      return false;
    }

    scanCache.add(key);
    return true;
  }
}
