import { ok, type QueueTask, type Result } from "shared";

import { QueueStore } from "../stores/queue";
import { type BackendSDK } from "../types";

export const getQueueTasks = (_: BackendSDK): Result<QueueTask[]> => {
  const store = QueueStore.get();
  return ok(store.getTasks());
};

export const getQueueTask = (_: BackendSDK, id: string): Result<QueueTask | undefined> => {
  const store = QueueStore.get();
  return ok(store.getTask(id));
};

export const clearQueueTasks = (_: BackendSDK): Result<void> => {
  const store = QueueStore.get();
  store.clearTasks();
  return ok(undefined);
};
