import { type DefineEvents, type SDK } from "caido:plugin";
import { type SessionState } from "shared";

import { type API } from ".";

export type BackendSDK = SDK<API, BackendEvents>;
export type BackendEvents = DefineEvents<{
  "session:created": (
    id: string,
    state: SessionState,
    { checksCount }: { checksCount: number }
  ) => void;
  "session:updated": (id: string, state: SessionState) => void;

  "passive:queue-new": (taskID: string, requestID: string) => void;
  "passive:queue-started": (taskID: string) => void;
  "passive:queue-finished": (taskID: string) => void;
}>;
