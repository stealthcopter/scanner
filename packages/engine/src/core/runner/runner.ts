import { type SDK } from "caido:plugin";

import {
  type Finding,
  type ScanConfig,
  type ScanDefinition,
  type ScanTarget,
} from "../../types";

import { ScanJob } from "./job";

export class ScanRunner {
  private scans: ScanDefinition[] = [];

  public register(scan: ScanDefinition): void {
    if (this.scans.some((s) => s.metadata.id === scan.metadata.id)) {
      throw new Error(`Scan with id '${scan.metadata.id}' already registered`);
    }

    this.scans.push(scan);
  }

  public async run(
    sdk: SDK,
    targets: ScanTarget[],
    config: ScanConfig,
  ): Promise<Finding[]> {
    const job = new ScanJob(this.scans, targets, sdk, config);
    const allFindings = await job.start();
    return allFindings;
  }
}
