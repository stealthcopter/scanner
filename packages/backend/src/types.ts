import { type DefineEvents, type SDK } from "caido:plugin";

import { type API } from ".";
import { Finding } from "packages/engine/src/types/finding";

export type BackendSDK = SDK<API, BackendEvents>;
export type BackendEvents = DefineEvents<{
  "scanner:finished": (sessionId: string) => void;
  "scanner:finding": (sessionId: string, finding: Finding) => void;
}>;
