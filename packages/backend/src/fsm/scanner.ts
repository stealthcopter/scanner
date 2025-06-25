import { type Finding } from "engine";
import { type ScanState } from "shared";

export type ScanEvent =
  | { type: "start" }
  | { type: "finish"; findings: Finding[] }
  | { type: "fail"; error: string };

export function scanSessionFSM(state: ScanState, event: ScanEvent): ScanState {
  switch (state.kind) {
    case "Pending":
      if (event.type === "start") {
        return {
          kind: "Running",
          createdAt: state.createdAt,
          startedAt: Date.now(),
        };
      }
      break;

    case "Running":
      if (event.type === "finish") {
        return {
          kind: "Done",
          createdAt: state.createdAt,
          startedAt: state.startedAt,
          finishedAt: Date.now(),
          findings: event.findings,
        };
      }
      if (event.type === "fail") {
        return {
          kind: "Error",
          createdAt: state.createdAt,
          error: event.error,
        };
      }
      break;

    case "Done":
    case "Error":
      break;
  }
  throw new Error(`Invalid event '${event.type}' in state '${state.kind}'`);
}
