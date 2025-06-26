import { type DefineEvents, type SDK } from "caido:plugin";
import { type SessionState } from "shared";

import { type API } from ".";

export type BackendSDK = SDK<API, BackendEvents>;
export type BackendEvents = DefineEvents<{
  "session:created": (id: string, state: SessionState) => void;
  "session:updated": (id: string, state: SessionState) => void;
}>;
