import { type DefineEvents, type SDK } from "caido:plugin";
import { type Finding } from "packages/engine/src/types/finding";

import { type API } from ".";

export type BackendSDK = SDK<API, BackendEvents>;
export type BackendEvents = DefineEvents<{
  "scanner:finished": (sessionId: string) => void;
  "scanner:finding": (sessionId: string, finding: Finding) => void;
}>;
