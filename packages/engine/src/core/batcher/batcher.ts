import { Graph, topologicalSort } from "graph-data-structure";

import { type ScanDefinition } from "../../types";

/**
 * Takes a list of scans and organizes them into execution batches
 * based on their `dependsOn` properties.
 */
export function getScanBatches(scans: ScanDefinition[]): ScanDefinition[][] {
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
