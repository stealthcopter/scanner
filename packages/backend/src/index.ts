import type { DefineAPI } from "caido:plugin";

import exposedEnvScan from "./checks/exposed-env";
import jsonHtmlResponse from "./checks/json-html-response";
import openRedirectScan from "./checks/open-redirect";
import { getChecks } from "./services/checks";
import { getUserConfig, updateUserConfig } from "./services/config";
import {
  cancelScanSession,
  getScanSession,
  getScanSessions,
  startActiveScan,
} from "./services/scanner";
import { ChecksStore } from "./stores/checks";
import { ConfigStore } from "./stores/config";
import { type BackendSDK } from "./types";
import { createRegistry } from "engine";

export { type BackendEvents } from "./types";

export type API = DefineAPI<{
  // Checks
  getChecks: typeof getChecks;

  // Config
  getUserConfig: typeof getUserConfig;
  updateUserConfig: typeof updateUserConfig;

  // Scanner
  startActiveScan: typeof startActiveScan;
  getScanSession: typeof getScanSession;
  getScanSessions: typeof getScanSessions;
  cancelScanSession: typeof cancelScanSession;
}>;

export function init(sdk: BackendSDK) {
  sdk.api.register("getChecks", getChecks);
  sdk.api.register("getUserConfig", getUserConfig);
  sdk.api.register("updateUserConfig", updateUserConfig);
  sdk.api.register("startActiveScan", startActiveScan);
  sdk.api.register("getScanSession", getScanSession);
  sdk.api.register("getScanSessions", getScanSessions);
  sdk.api.register("cancelScanSession", cancelScanSession);

  const checksStore = ChecksStore.get();
  checksStore.register(exposedEnvScan, openRedirectScan, jsonHtmlResponse);

  sdk.events.onInterceptResponse(async (sdk, request, response) => {
    const configStore = ConfigStore.get();
    const config = configStore.getUserConfig();

    if (!config.passive.enabled) return;

    if (config.passive.inScopeOnly) {
      const inScope = sdk.requests.inScope(request);
      if (!inScope) return;
    }

    const passiveChecks = checksStore.select({
      type: "passive",
      overrides: config.passive.overrides,
    });

    if (passiveChecks.length === 0) {
      return;
    }

    const registry = createRegistry();
    for (const check of passiveChecks) {
      registry.register(check);
    }

    const runnable = registry.create(sdk, {
      strength: config.passive.strength,
      inScopeOnly: true,
      concurrency: 1,
      scanTimeout: 5 * 60 * 1000,
      checkTimeout: 2 * 60 * 1000,
    });

    const result = await runnable.run([request.getId()]);
    if (result.kind !== "Finished") return;

    for (const finding of result.findings) {
      if (finding.correlation.requestID === undefined) return;

      const request = await sdk.requests.get(finding.correlation.requestID);
      if (!request) return;

      sdk.findings.create({
        reporter: "Scanner: Passive",
        request: request.request,
        title: finding.name,
        description: finding.description,
      });
    }
  });
}
