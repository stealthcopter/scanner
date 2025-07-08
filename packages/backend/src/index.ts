import type { DefineAPI } from "caido:plugin";
import { createRegistry } from "engine";

import exposedEnvScan from "./checks/exposed-env";
import jsonHtmlResponse from "./checks/json-html-response";
import openRedirectScan from "./checks/open-redirect";
import { getChecks } from "./services/checks";
import { getUserConfig, updateUserConfig } from "./services/config";
import {
  clearQueueTasks,
  getQueueTask,
  getQueueTasks,
} from "./services/queue";
import {
  cancelScanSession,
  getRequestResponse,
  getScanSession,
  getScanSessions,
  startActiveScan,
} from "./services/scanner";
import { ChecksStore } from "./stores/checks";
import { ConfigStore } from "./stores/config";
import { QueueStore } from "./stores/queue";
import { type BackendSDK } from "./types";
import { TaskQueue } from "./utils/task-queue";

export { type BackendEvents } from "./types";

export type API = DefineAPI<{
  // Checks
  getChecks: typeof getChecks;

  // Config
  getUserConfig: typeof getUserConfig;
  updateUserConfig: typeof updateUserConfig;

  // Queue
  getQueueTasks: typeof getQueueTasks;
  getQueueTask: typeof getQueueTask;
  clearQueueTasks: typeof clearQueueTasks;

  // Scanner
  startActiveScan: typeof startActiveScan;
  getScanSession: typeof getScanSession;
  getScanSessions: typeof getScanSessions;
  cancelScanSession: typeof cancelScanSession;
  getRequestResponse: typeof getRequestResponse;
}>;

export function init(sdk: BackendSDK) {
  sdk.api.register("getChecks", getChecks);
  sdk.api.register("getUserConfig", getUserConfig);
  sdk.api.register("updateUserConfig", updateUserConfig);
  sdk.api.register("getQueueTasks", getQueueTasks);
  sdk.api.register("getQueueTask", getQueueTask);
  sdk.api.register("clearQueueTasks", clearQueueTasks);
  sdk.api.register("startActiveScan", startActiveScan);
  sdk.api.register("getScanSession", getScanSession);
  sdk.api.register("getScanSessions", getScanSessions);
  sdk.api.register("cancelScanSession", cancelScanSession);
  sdk.api.register("getRequestResponse", getRequestResponse);

  const checksStore = ChecksStore.get();
  checksStore.register(exposedEnvScan, openRedirectScan, jsonHtmlResponse);

  const configStore = ConfigStore.get();
  const queueStore = QueueStore.get();
  const config = configStore.getUserConfig();
  const passiveTaskQueue = new TaskQueue(config.passive.scansConcurrency);
  queueStore.setPassiveTaskQueue(passiveTaskQueue);

  const passiveDedupeKeys = new Map<string, Set<string>>();
  sdk.events.onInterceptResponse(async (sdk, request) => {
    const config = configStore.getUserConfig();
    if (!config.passive.enabled) return;

    passiveTaskQueue.setConcurrency(config.passive.scansConcurrency);

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

    const passiveTaskID = "pt-" + Math.random().toString(36).substring(2);
    queueStore.addTask(passiveTaskID, request.getId());
    sdk.api.send("passive:queue-new", passiveTaskID, request.getId());

    passiveTaskQueue.add(async () => {
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

      runnable.externalDedupeKeys(passiveDedupeKeys);

      try {
        queueStore.addActiveRunnable(passiveTaskID, runnable);
        queueStore.updateTaskStatus(passiveTaskID, "running");
        sdk.api.send("passive:queue-started", passiveTaskID);

        const result = await runnable.run([request.getId()]);

        // TODO: handle error, show UI warnings
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
      } catch (error) {
        // TODO: handle error, show UI warnings
        sdk.console.log("error", error);
      } finally {
        queueStore.removeActiveRunnable(passiveTaskID);
        queueStore.removeTask(passiveTaskID);
        sdk.api.send("passive:queue-finished", passiveTaskID);
      }
    });
  });
}
