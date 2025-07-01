import { ScanRunner } from "engine";
import {
  error,
  ok,
  ScanRequestPayload,
  type Result,
  type SessionState,
} from "shared";

import { ChecksStore } from "../stores/checks";
import { ConfigStore } from "../stores/config";
import { ScannerStore } from "../stores/scanner";
import { type BackendSDK } from "../types";

export const startActiveScan = async (
  sdk: BackendSDK,
  payload: ScanRequestPayload
): Promise<Result<SessionState>> => {
  const { requestIDs, scanConfig } = payload;

  if (requestIDs.length === 0) {
    return error("No targets provided");
  }

  const configStore = ConfigStore.get();
  const userConfig = configStore.getUserConfig();

  const checksStore = ChecksStore.get();
  const activeChecks = checksStore.select({
    type: "active",
    overrides: userConfig.active.overrides,
  });

  if (activeChecks.length === 0) {
    return error("No active scans available");
  }

  const scannerStore = ScannerStore.get();
  const initialSession = scannerStore.createSession();

  // TODO: move this to separate file and reuse in passive scan
  (async () => {
    const { id } = initialSession;

    try {
      const startedSession = scannerStore.send(id, {
        type: "Start",
      });
      sdk.api.send("session:created", id, startedSession);

      const runner = new ScanRunner();
      runner.register(...activeChecks);

      runner.on("scan:finding", async ({ finding }) => {
        sdk.console.log("onFinding=" + finding.requestID);

        const findingAddedSession = scannerStore.send(id, {
          type: "AddFinding",
          finding,
        });
        sdk.api.send("session:updated", id, findingAddedSession);

        const result = await sdk.requests.get(finding.requestID);
        if (!result) return;

        sdk.findings.create({
          request: result.request,
          reporter: "Scanner: Active",
          title: finding.name,
          description: finding.description,
        });
      });

      runner.on("scan:check-finished", ({ checkID }) => {
        sdk.console.log("onCheckFinished=" + checkID);

        const checkFinishedSession = scannerStore.send(id, {
          type: "AddCheckCompleted",
        });
        sdk.api.send("session:updated", id, checkFinishedSession);
      });

      runner.on("scan:request", ({ requestID, responseID }) => {
        sdk.console.log("onRequest=" + requestID + " " + responseID);

        const requestSentSession = scannerStore.send(id, {
          type: "AddRequestSent",
        });
        sdk.api.send("session:updated", id, requestSentSession);
      });

      const result = await runner.start(sdk, requestIDs, scanConfig);

      switch (result.kind) {
        case "Finished": {
          const finishedSession = scannerStore.send(id, {
            type: "Finish",
            findings: result.findings,
          });
          sdk.api.send("session:updated", id, finishedSession);
          break;
        }
        case "Interrupted": {
          const interruptedSession = scannerStore.send(id, {
            type: "Interrupted",
            reason: result.reason,
          });
          sdk.api.send("session:updated", id, interruptedSession);
          break;
        }
        case "Error": {
          const errorSession = scannerStore.send(id, {
            type: "Error",
            error: result.error,
          });
          sdk.api.send("session:updated", id, errorSession);
          break;
        }
      }
    } catch (err) {
      const errorSession = scannerStore.send(id, {
        type: "Error",
        error: err as string,
      });
      sdk.api.send("session:updated", id, errorSession);
    }
  })();

  return ok(initialSession);
};

export const getScanSession = (
  _: BackendSDK,
  id: string
): Result<SessionState> => {
  const session = ScannerStore.get().getSession(id);
  if (!session) {
    return error(`Session ${id} not found`);
  }

  return ok(session);
};

export const getScanSessions = (_: BackendSDK): Result<SessionState[]> => {
  const sessions = ScannerStore.get().listSessions();
  return ok(sessions);
};
