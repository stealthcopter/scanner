import type { Session } from "shared";

export type SessionsState =
  | { type: "Idle" }
  | { type: "Loading" }
  | { type: "Error"; error: string }
  | { type: "Success"; sessions: Session[] };
