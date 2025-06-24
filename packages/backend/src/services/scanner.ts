import { type Finding, ScanRunner, type ScanTarget } from "engine";
import { error, ok, type Result } from "shared";

import { ChecksStore } from "../stores/checks";
import { ConfigStore } from "../stores/config";
import { type BackendSDK } from "../types";

export const startActiveScan = async (
  sdk: BackendSDK,
  requestIDs: string[],
): Promise<Result<Finding[]>> => {
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

  const runner = new ScanRunner();
  runner.register(...activeScans);

  const findings: Finding[] = await runner.run(sdk, targets, {
    strength: config.passive.strength,
  });

  return ok(findings);
};
