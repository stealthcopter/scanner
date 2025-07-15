import { type DefineEvents, type SDK } from "caido:plugin";
import { type DeepPartial, type Session, type SessionProgress } from "shared";

import { type API } from ".";

export type BackendSDK = SDK<API, BackendEvents>;
export type BackendEvents = DefineEvents<{
  "session:created": (
    sessionID: string,
    state: Session,
    { checksTotal }: { checksTotal: number },
  ) => void;
  "session:updated": (sessionID: string, state: Session) => void;
  "session:progress": (
    sessionID: string,
    progress: DeepPartial<SessionProgress>,
  ) => void;
  "passive:queue-new": (taskID: string, requestID: string) => void;
  "passive:queue-started": (taskID: string) => void;
  "passive:queue-finished": (taskID: string) => void;
}>;
