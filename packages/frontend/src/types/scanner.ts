import type { SessionState } from "shared";

export type ScannerSessionsState =
  | { type: "Idle" }
  | { type: "Loading" }
  | { type: "Error"; error: string }
  | { type: "Success"; sessions: SessionState[] };
