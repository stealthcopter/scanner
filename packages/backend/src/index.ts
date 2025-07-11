import type { DefineAPI } from "caido:plugin";
import { createRegistry } from "engine";

import { checks } from "./checks";
import { getChecks } from "./services/checks";
import { getUserConfig, updateUserConfig } from "./services/config";
import { clearQueueTasks, getQueueTask, getQueueTasks } from "./services/queue";
import {
  cancelScanSession,
  deleteScanSession,
  getRequestResponse,
  getScanSession,
  getScanSessions,
  startActiveScan,
  updateSessionTitle,
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
  deleteScanSession: typeof deleteScanSession;
  getRequestResponse: typeof getRequestResponse;
  updateSessionTitle: typeof updateSessionTitle;
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
  sdk.api.register("deleteScanSession", deleteScanSession);
  sdk.api.register("getRequestResponse", getRequestResponse);
  sdk.api.register("updateSessionTitle", updateSessionTitle);

  const checksStore = ChecksStore.get();
  checksStore.register(...checks);

  const configStore = ConfigStore.get();
  const queueStore = QueueStore.get();
  const config = configStore.getUserConfig();
  const passiveTaskQueue = new TaskQueue(config.passive.scansConcurrency);
  queueStore.setPassiveTaskQueue(passiveTaskQueue);

  const passiveDedupeKeys = new Map<string, Set<string>>();
  sdk.events.onInterceptResponse((sdk, request) => {
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

    const passiveTaskID =
      "pscan-" + Math.random().toString(36).substring(2, 15);
    queueStore.addTask(passiveTaskID, request.getId());
    sdk.api.send("passive:queue-new", passiveTaskID, request.getId());

    passiveTaskQueue.add(async () => {
      const registry = createRegistry();
      for (const check of passiveChecks) {
        registry.register(check);
      }

      const runnable = registry.create(sdk, {
        aggressivity: config.passive.aggressivity,
        inScopeOnly: true,
        concurrency: 1,
        scanTimeout: 5 * 60,
        checkTimeout: 2 * 60,
      });

      runnable.externalDedupeKeys(passiveDedupeKeys);

      try {
        queueStore.addActiveRunnable(passiveTaskID, runnable);
        queueStore.updateTaskStatus(passiveTaskID, "running");
        sdk.api.send("passive:queue-started", passiveTaskID);

        runnable.on("scan:finding", async ({ finding }) => {
          if (finding.correlation.requestID === undefined) return;

          const request = await sdk.requests.get(finding.correlation.requestID);
          if (!request) return;

          sdk.findings.create({
            reporter: "Scanner: Passive",
            request: request.request,
            title: finding.name,
            description: finding.description,
          });
        });

        // TODO: handle error, show UI warnings if result kind is not finished
        await runnable.run([request.getId()]);
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
