import { Graph, topologicalSort } from "graph-data-structure";

import { type ScanDefinition } from "../../api/types";

export class DependencyManager {
  public getExecutionBatches(scans: ScanDefinition[]): ScanDefinition[][] {
    const graph = new Graph();
    const map = new Map(scans.map((s) => [s.metadata.id, s]));

    scans.forEach((s) => graph.addNode(s.metadata.id));

    scans.forEach((scan) => {
      scan.metadata.dependsOn?.forEach((d) => {
        if (!map.has(d)) {
          throw new Error(
            `Scan '${scan.metadata.id}' has unknown dependency '${d}'`,
          );
        }
        graph.addEdge(d, scan.metadata.id);
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
