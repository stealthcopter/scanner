import { createRegistry } from "engine";
import {
  error,
  ok,
  type Result,
  type ScanRequestPayload,
  type SessionState,
} from "shared";

import { ChecksStore } from "../stores/checks";
import { ConfigStore } from "../stores/config";
import { ScannerStore } from "../stores/scanner";
import { type BackendSDK } from "../types";

export const startActiveScan = (
  sdk: BackendSDK,
  payload: ScanRequestPayload
): Result<SessionState> => {
  const { requestIDs, scanConfig, title } = payload;

  if (requestIDs.length === 0) {
    return error("No targets provided");
  }

  if (title.length === 0) {
    return error("Title is required");
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
  const initialSession = scannerStore.createSession(title);

  // TODO: move this to separate file and reuse in passive scan
  (async () => {
    const { id } = initialSession;

    try {
      const registry = createRegistry();
      for (const check of activeChecks) {
        registry.register(check);
      }

      const runnable = registry.create(sdk, scanConfig);
      scannerStore.registerRunnable(id, runnable);

      const estimate = await runnable.estimate(requestIDs);
      if (estimate.kind === "Error") {
        throw new Error(estimate.error);
      }

      const startedSession = scannerStore.send(id, {
        type: "Start",
        checksTotal: estimate.checksTotal,
      });

      sdk.api.send("session:created", id, startedSession, {
        checksTotal: estimate.checksTotal,
      });

      runnable.on(
        "scan:finding",
        async ({ finding, targetRequestID, checkID }) => {
          const findingAddedSession = scannerStore.send(id, {
            type: "AddFinding",
            finding,
            relatedTargetID: targetRequestID,
            relatedCheckID: checkID,
          });
          if (!findingAddedSession) return;

          sdk.api.send("session:updated", id, findingAddedSession);

          const result = await sdk.requests.get(finding.correlation.requestID);
          if (!result) return;

          sdk.findings.create({
            request: result.request,
            reporter: "Scanner: Active",
            title: finding.name,
            description: finding.description,
          });
        }
      );

      runnable.on("scan:check-finished", ({ checkID, targetRequestID }) => {
        const checkFinishedSession = scannerStore.send(id, {
          type: "AddCheckCompleted",
          checkID,
          targetRequestID,
        });
        if (!checkFinishedSession || checkFinishedSession.kind !== "Running")
          return;

        sdk.api.send("session:progress", id, checkFinishedSession.progress);
      });

      runnable.on(
        "scan:request-pending",
        ({ pendingRequestID, targetRequestID, checkID }) => {
          const requestPendingSession = scannerStore.send(id, {
            type: "AddRequestSent",
            request: {
              status: "pending",
              pendingRequestID,
              sentAt: Date.now(),
            },
            relatedCheckID: checkID,
            relatedTargetID: targetRequestID,
          });
          if (
            !requestPendingSession ||
            requestPendingSession.kind !== "Running"
          )
            return;

          sdk.api.send("session:progress", id, requestPendingSession.progress);
        }
      );

      runnable.on(
        "scan:request-completed",
        ({ pendingRequestID, requestID, checkID, targetRequestID }) => {
          const requestCompletedSession = scannerStore.send(id, {
            type: "AddRequestCompleted",
            request: {
              status: "completed",
              pendingRequestID,
              requestID,
              sentAt: Date.now(),
              completedAt: Date.now(),
            },
            relatedCheckID: checkID,
            relatedTargetID: targetRequestID,
          });
          if (
            !requestCompletedSession ||
            requestCompletedSession.kind !== "Running"
          )
            return;

          sdk.api.send(
            "session:progress",
            id,
            requestCompletedSession.progress
          );
        }
      );

      runnable.on(
        "scan:request-failed",
        ({ error, pendingRequestID, checkID, targetRequestID }) => {
          const requestFailedSession = scannerStore.send(id, {
            type: "AddRequestFailed",
            request: {
              status: "failed",
              pendingRequestID,
              error,
              sentAt: Date.now(),
              completedAt: Date.now(),
            },
            relatedCheckID: checkID,
            relatedTargetID: targetRequestID,
          });
          if (!requestFailedSession || requestFailedSession.kind !== "Running")
            return;

          sdk.api.send("session:progress", id, requestFailedSession.progress);
        }
      );

      runnable.on("scan:check-started", ({ checkID, targetRequestID }) => {
        const checkRunningSession = scannerStore.send(id, {
          type: "AddCheckRunning",
          checkID,
          targetRequestID,
        });
        if (!checkRunningSession || checkRunningSession.kind !== "Running")
          return;

        sdk.api.send("session:progress", id, checkRunningSession.progress);
      });

      runnable.on(
        "scan:check-failed",
        ({ checkID, errorMessage, targetRequestID }) => {
          const checkFailedSession = scannerStore.send(id, {
            type: "AddCheckFailed",
            checkID,
            targetRequestID,
            error: errorMessage || "Unknown error",
          });
          if (!checkFailedSession || checkFailedSession.kind !== "Running")
            return;

          sdk.api.send("session:progress", id, checkFailedSession.progress);
        }
      );

      const result = await runnable.run(requestIDs);

      switch (result.kind) {
        case "Finished": {
          const finishedSession = scannerStore.send(id, {
            type: "Finish",
          });
          if (!finishedSession) break;
          sdk.api.send("session:updated", id, finishedSession);
          break;
        }
        case "Interrupted": {
          const interruptedSession = scannerStore.send(id, {
            type: "Interrupted",
            reason: result.reason,
          });
          if (!interruptedSession) break;
          sdk.api.send("session:updated", id, interruptedSession);
          break;
        }
        case "Error": {
          const errorSession = scannerStore.send(id, {
            type: "Error",
            error: result.error,
          });
          if (!errorSession) break;
          sdk.api.send("session:updated", id, errorSession);
          break;
        }
      }
    } catch (err) {
      const errorSession = scannerStore.send(id, {
        type: "Error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
      if (!errorSession) return;
      sdk.api.send("session:updated", id, errorSession);
    } finally {
      scannerStore.unregisterRunnable(id);
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

export const cancelScanSession = async (
  _: BackendSDK,
  id: string
): Promise<Result<boolean>> => {
  const store = ScannerStore.get();
  const result = await store.cancelRunnable(id);
  return ok(result);
};

export const deleteScanSession = (
  _: BackendSDK,
  id: string
): Result<boolean> => {
  const result = ScannerStore.get().deleteSession(id);
  return ok(result);
};

export const getRequestResponse = async (
  sdk: BackendSDK,
  requestId: string
): Promise<
  Result<{
    request: { id: string; raw: string };
    response: { id: string; raw: string };
  }>
> => {
  const result = await sdk.requests.get(requestId);

  if (!result) {
    return error("Request not found");
  }

  const { request, response } = result;

  if (!response) {
    return error("Response not found");
  }

  return ok({
    request: {
      id: request.getId(),
      raw: Uint8ArrayToString(request.toSpecRaw().getRaw()),
    },
    response: {
      id: response.getId(),
      raw: response.getRaw().toText(),
    },
  });
};

export const Uint8ArrayToString = (data: Uint8Array) => {
  let output = "";
  const chunkSize = 256;
  for (let i = 0; i < data.length; i += chunkSize) {
    output += String.fromCharCode(...data.subarray(i, i + chunkSize));
  }

  return output;
};
