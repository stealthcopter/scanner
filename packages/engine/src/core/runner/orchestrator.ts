import { type SDK } from "caido:plugin";
import { Graph, topologicalSort } from "graph-data-structure";

import {
  type Finding,
  type ScanConfig,
  type ScanDefinition,
  type ScanTarget,
} from "../../types";
import { DependencyStore, HtmlCache } from "../runtime";

import { TargetProcessor } from "./processor";

/**
 * ScanOrchestrator is responsible for managing the lifecycle and shared state of a single scan run.
 * It coordinates the processing of multiple targets and holds shared data like the dependency store,
 */
export class ScanOrchestrator {
  public readonly batches: ScanDefinition[][];
  public readonly dependencyStore = new DependencyStore();
  public readonly htmlCache = new HtmlCache();
  public readonly dedupeKeysCache = new Map<string, Set<string>>();

  constructor(
    private readonly scans: ScanDefinition[],
    public readonly sdk: SDK,
    public readonly config: ScanConfig,
  ) {
    this.batches = this.getScanBatches(this.scans);
  }

  public async execute(targets: ScanTarget[]): Promise<Finding[]> {
    const allFindings: Finding[] = [];

    for (const target of targets) {
      const processor = new TargetProcessor(target, this);
      const findings = await processor.process();
      allFindings.push(...findings);
    }

    return allFindings;
  }

  private getScanBatches(scans: ScanDefinition[]): ScanDefinition[][] {
    const graph = new Graph();
    const map = new Map(scans.map((s) => [s.metadata.id, s]));

    scans.forEach((s) => graph.addNode(s.metadata.id));

    scans.forEach((scan) => {
      scan.metadata.dependsOn?.forEach((dependencyId) => {
        if (!map.has(dependencyId)) {
          throw new Error(
            `Scan '${scan.metadata.id}' has unknown dependency '${dependencyId}'`,
          );
        }
        graph.addEdge(dependencyId, scan.metadata.id);
      });
    });

    try {
      const order = topologicalSort(graph);
      return order.map((id) => [map.get(id)!]);
    } catch (e) {
      throw new Error("Circular dependency detected in scans");
    }
  }
}
