import { Graph, topologicalSort } from "graph-data-structure";

import { type ScanDefinition } from "../../api/types";

export class DependencyManager {
  public getExecutionBatches(scans: ScanDefinition[]): ScanDefinition[][] {
    const graph = new Graph();
    const map = new Map(scans.map((s) => [s.id, s]));

    scans.forEach((s) => graph.addNode(s.id));

    scans.forEach((scan) => {
      scan.dependsOn?.forEach((d) => {
        if (!map.has(d)) {
          throw new Error(`Scan '${scan.id}' has unknown dependency '${d}'`);
        }
        graph.addEdge(d, scan.id);
      });
    });

    try {
      const order = topologicalSort(graph);
      return order.map((id) => [map.get(id)!]);
    } catch {
      throw new Error("Circular dependency detected in scans");
    }
  }
}
