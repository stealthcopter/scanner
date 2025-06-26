import { type SDK } from "caido:plugin";

import {
  type Finding,
  type ScanCallbacks,
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

  public register(...scans: ScanDefinition[]): void {
    for (const scan of scans) {
      if (this.scans.some((s) => s.metadata.id === scan.metadata.id)) {
        throw new Error(
          `Scan with id '${scan.metadata.id}' already registered`,
        );
      }
      this.scans.push(scan);
    }
  }

  public async run(
    sdk: SDK,
    targets: ScanTarget[],
    config: ScanConfig,
    callbacks?: ScanCallbacks,
  ): Promise<Finding[]> {
    const orchestrator = new ScanOrchestrator(this.scans, sdk, config);
    const findings = await orchestrator.execute(targets, callbacks);
    return findings;
  }
}
