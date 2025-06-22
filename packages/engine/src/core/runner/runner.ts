import { type SDK } from "caido:plugin";

import {
  type Finding,
  type ScanConfig,
  type ScanDefinition,
  type ScanTarget,
} from "../../types";

import { ScanOrchestrator } from "./orchestrator";

/**
 * ScanRunner is responsible for registering scan definitions and initiating scan runs.
 * It acts as the public API for the scanning engine.
 */
export class ScanRunner {
  public readonly scans: ScanDefinition[] = [];

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
    const orchestrator = new ScanOrchestrator(this.scans, sdk, config);
    return await orchestrator.execute(targets);
  }
}
