import { ok, type QueueTask, type Result } from "shared";

import { IdSchema } from "../schemas";
import { QueueStore } from "../stores/queue";
import { type BackendSDK } from "../types";
import { validateInput } from "../utils/validation";

export const getQueueTasks = (_: BackendSDK): Result<QueueTask[]> => {
  const store = QueueStore.get();
  return ok(store.getTasks());
};

export const getQueueTask = (
  _: BackendSDK,
  id: string,
): Result<QueueTask | undefined> => {
  const validation = validateInput(IdSchema, id);
  if (validation.kind === "Error") {
    return validation;
  }

  const store = QueueStore.get();
  return ok(store.getTask(validation.value));
};

export const clearQueueTasks = (_: BackendSDK): Result<void> => {
  const store = QueueStore.get();
  store.clearTasks();
  return ok(undefined);
};
