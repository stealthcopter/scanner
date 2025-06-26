import { UserConfig } from "shared";

export type ConfigState =
  | { type: "Idle" }
  | { type: "Loading" }
  | { type: "Error"; error: string }
  | { type: "Success"; config: UserConfig };
