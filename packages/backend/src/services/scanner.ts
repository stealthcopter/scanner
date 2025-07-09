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
      scannerStore.setRunnable(id, runnable);

      const estimate = await runnable.estimate(requestIDs);
      if (estimate.kind === "Error") {
        return error(estimate.error);
      }

      const startedSession = scannerStore.send(id, {
        type: "Start",
        checksCount: estimate.checksCount,
      });

      sdk.api.send("session:created", id, startedSession, {
        checksCount: estimate.checksCount,
      });

      runnable.on("scan:started", () => {
        sdk.console.log("onStarted");
      });

      runnable.on("scan:check-started", ({ checkID }) => {
        sdk.console.log("onCheckStarted=" + checkID);
      });

      runnable.on("scan:finding", async ({ finding }) => {
        sdk.console.log("onFinding=" + finding.correlation.requestID);

        const findingAddedSession = scannerStore.send(id, {
          type: "AddFinding",
          finding,
        });
        sdk.api.send("session:updated", id, findingAddedSession);

        const result = await sdk.requests.get(finding.correlation.requestID);
        if (!result) return;

        sdk.findings.create({
          request: result.request,
          reporter: "Scanner: Active",
          title: finding.name,
          description: finding.description,
        });
      });

      runnable.on("scan:check-finished", ({ checkID }) => {
        sdk.console.log("onCheckFinished=" + checkID);

        const checkFinishedSession = scannerStore.send(id, {
          type: "AddCheckCompleted",
        });
        sdk.api.send("session:updated", id, checkFinishedSession);
      });

      runnable.on("scan:request-pending", ({ pendingRequestID }) => {
        sdk.console.log("onRequestPending=" + pendingRequestID);

        const requestPendingSession = scannerStore.send(id, {
          type: "AddRequestSent",
        });
        sdk.api.send("session:updated", id, requestPendingSession);
      });

      runnable.on("scan:finished", () => {
        sdk.console.log("onFinished");
      });

      const result = await runnable.run(requestIDs);
      scannerStore.deleteRunnable(id);

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

export const cancelScanSession = (
  _: BackendSDK,
  id: string
): Result<boolean> => {
  const result = ScannerStore.get().cancelRunnable(id);
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
