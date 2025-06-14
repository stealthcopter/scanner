import { type ScanDefinition } from "engine";

import { type SelectOptions } from "./types";

export class ScanRegistry {
  private scans: ScanDefinition[] = [];

  /**
   * Registers a list of scans.
   */
  public register(scans: ScanDefinition[]) {
    this.scans.push(...scans);
  }

  /**
   * Selects a list of scans based on the provided filtering criteria.
   */
  public select(options: SelectOptions = {}): ScanDefinition[] {
    let selectedScans: ScanDefinition[];

    if (options.include) {
      const includeSet = new Set(options.include);
      selectedScans = this.scans.filter((scan) =>
        includeSet.has(scan.metadata.id),
      );
    } else {
      selectedScans = [...this.scans];
    }

    if (options.type) {
      selectedScans = selectedScans.filter(
        (scan) => scan.metadata.type === options.type,
      );
    }

    if (options.exclude) {
      const excludeSet = new Set(options.exclude);
      selectedScans = selectedScans.filter(
        (scan) => !excludeSet.has(scan.metadata.id),
      );
    }

    return selectedScans;
  }

  /**
   * Gets all registered scans without applying any filters.
   */
  public getAll(): ScanDefinition[] {
    return [...this.scans];
  }
}
