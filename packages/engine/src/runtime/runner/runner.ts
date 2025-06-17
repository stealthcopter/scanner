import { type SDK } from "caido:plugin";

import {
  type Finding,
  type RequestContext,
  type ScanDefinition,
  ScanStrength,
} from "../../api/types";

import { ScanJob } from "./execution";
import { RunnerState, type RunOptions } from "./types";

export class ScanRunner {
  private scans: ScanDefinition[] = [];
  private state: RunnerState = RunnerState.IDLE;

  public register(scan: ScanDefinition): void {
    if (this.state !== RunnerState.IDLE) {
      throw new Error("Cannot register scans while a run is in progress.");
    }

    if (this.scans.some((s) => s.metadata.id === scan.metadata.id)) {
      throw new Error(`Scan with id '${scan.metadata.id}' already registered`);
    }

    this.scans.push(scan);
  }

  public async run(
    contexts: RequestContext[],
    sdk: SDK,
    options: RunOptions,
  ): Promise<Finding[]> {
    if (this.state !== RunnerState.IDLE) {
      throw new Error("ScanRunner is already running or has been stopped.");
    }

    this.state = RunnerState.RUNNING;

    const eligibleScans = this.scans.filter((scan) => {
      const minStrength = scan.metadata.minStrength ?? ScanStrength.LOW;
      return options.strength >= minStrength;
    });

    const job = new ScanJob(
      eligibleScans,
      contexts,
      sdk,
      options,
      () => this.state,
    );

    const allFindings = await job.start();

    this.state = RunnerState.IDLE;
    return allFindings;
  }

  public getState(): RunnerState {
    return this.state;
  }

  public setState(state: RunnerState): void {
    this.state = state;
  }
}
