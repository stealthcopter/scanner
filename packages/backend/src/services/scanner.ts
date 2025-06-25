import { ScanCallbacks, ScanRunner, type ScanTarget } from "engine";
import { error, ok, type Result, type ScanState } from "shared";

import { ChecksStore } from "../stores/checks";
import { ConfigStore } from "../stores/config";
import { ScannerStore } from "../stores/scanner";
import { type BackendSDK } from "../types";

export const startActiveScan = async (
  sdk: BackendSDK,
  requestIDs: string[]
): Promise<Result<string>> => {
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
  const sessionId = scannerStore.createSession();

  (async () => {
    try {
      scannerStore.send(sessionId, { type: "start" });

      const runner = new ScanRunner();
      runner.register(...activeScans);

      const callbacks: ScanCallbacks = {
        onFinding: async (finding) => {
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
        callbacks
      );

      scannerStore.send(sessionId, { type: "finish", findings });
      sdk.api.send("scanner:finished", sessionId);
    } catch (err: unknown) {
      scannerStore.send(sessionId, {
        type: "fail",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  })();

  return ok(sessionId);
};

export const getScanSession = (
  _: BackendSDK,
  id: string
): Result<ScanState> => {
  const session = ScannerStore.get().getSession(id);
  if (!session) {
    return error(`Session ${id} not found`);
  }

  return ok(session);
};
