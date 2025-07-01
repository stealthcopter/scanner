import { type SDK } from "caido:plugin";

import {
  Finding,
  type CheckDefinition,
  type ScanConfig,
  type ScanResult,
  type ScanState,
} from "../../types";

import { ScanOrchestrator } from "./orchestrator";
import mitt, { Emitter } from "mitt";

type ScanEvents = {
  "scan:finding": { finding: Finding };
  "scan:check-finished": { checkID: string };
  "scan:request": { requestID: string; responseID: string };
};

/**
 * ScanRunner is responsible for registering scan definitions and initiating scan runs.
 * It acts as the public API for the scanning engine.
 */
export class ScanRunner {
  public readonly checks: CheckDefinition[] = [];
  public state: ScanState = "Idle";
  private emitter: Emitter<ScanEvents>;
  private orchestrator: ScanOrchestrator | undefined;

  constructor() {
    this.emitter = mitt<ScanEvents>();
  }

  public on<K extends keyof ScanEvents>(
    event: K,
    callback: (data: ScanEvents[K]) => void
  ): void {
    this.emitter.on(
      event,
      callback as (data: ScanEvents[keyof ScanEvents]) => void
    );
  }

  public emit(
    event: keyof ScanEvents,
    data: ScanEvents[keyof ScanEvents]
  ): void {
    this.emitter.emit(event, data);
  }

  public register(...checks: CheckDefinition[]): void {
    if (this.state !== "Idle") {
      throw new Error("Cannot register checks while scan is running");
    }

    for (const check of checks) {
      if (this.checks.some((s) => s.metadata.id === check.metadata.id)) {
        throw new Error(
          `Scan with id '${check.metadata.id}' already registered`
        );
      }
      this.checks.push(check);
    }
  }

  public stop(): void {
    if (this.state !== "Running") {
      throw new Error("Scan not running");
    }

    this.state = "Interrupted";
  }

  public async start(
    sdk: SDK,
    requestIDs: string[],
    config: ScanConfig
  ): Promise<ScanResult> {
    if (this.state !== "Idle") {
      throw new Error("Scan already running");
    }

    if (this.checks.length === 0) {
      throw new Error("No checks registered");
    }

    if (requestIDs.length === 0) {
      throw new Error("No request IDs provided");
    }

    this.state = "Running";

    try {
      this.orchestrator = new ScanOrchestrator(this, sdk, config);
      const result = await this.orchestrator.execute(requestIDs);

      this.state = result.kind === "Finished" ? "Finished" : "Interrupted";
      return result;
    } catch (err) {
      this.state = "Error";
      return {
        kind: "Error",
        error: err as string,
      };
    }
  }
}
