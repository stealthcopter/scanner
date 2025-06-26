import { type ScanCallbacks, ScanRunner, type ScanTarget } from "engine";
import { error, ok, type Result, type SessionState } from "shared";

import { ChecksStore } from "../stores/checks";
import { ConfigStore } from "../stores/config";
import { ScannerStore } from "../stores/scanner";
import { type BackendSDK } from "../types";

export const startActiveScan = async (
  sdk: BackendSDK,
  requestIDs: string[],
): Promise<Result<SessionState>> => {
  if (requestIDs.length === 0) {
    return error("No targets provided");
  }

  const targets: ScanTarget[] = [];
  for (const id of requestIDs) {
    const requestResponse = await sdk.requests.get(id);
    if (requestResponse?.request && requestResponse?.response) {
      targets.push({
        request: requestResponse.request,
        response: requestResponse.response,
      });
    }
  }

  const checksStore = ChecksStore.get();
  const activeScans = checksStore.select({ type: "active" });
  if (activeScans.length === 0) {
    return error("No active scans available");
  }

  const configStore = ConfigStore.get();
  const config = configStore.getUserConfig();

  const scannerStore = ScannerStore.get();
  const initialSession = scannerStore.createSession();

  (async () => {
    const { id } = initialSession;

    try {
      const startedSession = scannerStore.send(id, { type: "Start" });
      sdk.api.send("session:created", id, startedSession);

      const runner = new ScanRunner();
      runner.register(...activeScans);

      const callbacks: ScanCallbacks = {
        onFinding: async (finding) => {
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
        },
      };

      const findings = await runner.run(
        sdk,
        targets,
        {
          strength: config.passive.strength,
        },
        callbacks,
      );

      const finishedSession = scannerStore.send(id, {
        type: "Finish",
        findings,
      });
      sdk.api.send("session:updated", id, finishedSession);
    } catch (err: unknown) {
      const errorSession = scannerStore.send(id, {
        type: "Error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
      sdk.api.send("session:updated", id, errorSession);
    }
  })();

  return ok(initialSession);
};

export const getScanSession = (
  _: BackendSDK,
  id: string,
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
