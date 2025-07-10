import { type DefineEvents, type SDK } from "caido:plugin";
import { type SessionProgress, type SessionState } from "shared";

import { type API } from ".";

export type BackendSDK = SDK<API, BackendEvents>;
export type BackendEvents = DefineEvents<{
  "session:created": (
    sessionID: string,
    state: SessionState,
    { checksTotal }: { checksTotal: number },
  ) => void;
  "session:updated": (sessionID: string, state: SessionState) => void;
  "session:progress": (
    sessionID: string,
    progress: Partial<SessionProgress>,
  ) => void;
  "passive:queue-new": (taskID: string, requestID: string) => void;
  "passive:queue-started": (taskID: string) => void;
  "passive:queue-finished": (taskID: string) => void;
}>;
