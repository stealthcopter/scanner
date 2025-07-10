import { defineStore } from "pinia";
import { computed } from "vue";

import { useSDK } from "@/plugins/sdk";
import { useQueueRepository } from "@/repositories/queue";
import { useQueueStore } from "@/stores/queue";

export const useQueueService = defineStore("services.queue", () => {
  const sdk = useSDK();
  const store = useQueueStore();
  const repository = useQueueRepository();

  const getState = () => store.getState();

  const initialize = async () => {
    store.send({ type: "Start" });

    const result = await sdk.backend.getQueueTasks();
    if (result.kind === "Success") {
      store.send({ type: "Success", tasks: result.value });
    } else {
      store.send({ type: "Error", error: result.error });
    }

    sdk.backend.onEvent("passive:queue-new", (taskId, requestID) => {
      console.log("passive:queue-new", { taskId, requestID });
      store.send({ type: "AddTask", taskId, requestID });
    });

    sdk.backend.onEvent("passive:queue-started", (taskId) => {
      console.log("passive:queue-started", { taskId });
      store.send({ type: "StartTask", taskId });
    });

    sdk.backend.onEvent("passive:queue-finished", (taskId) => {
      console.log("passive:queue-finished", { taskId });
      store.send({ type: "FinishTask", taskId });
    });
  };

  const clearQueue = async () => {
    const result = await repository.clearQueueTasks();
    if (result.kind === "Success") {
      store.send({ type: "Clear" });
    } else {
      store.send({ type: "Error", error: result.error });
    }
  };

  const selectTask = async (taskId: string) => {
    const state = store.getState();
    if (state.type !== "Success") return;

    const task = state.tasks.find((t) => t.id === taskId);
    if (task === undefined) {
      store.selectionState.send({ type: "Reset" });
      return;
    }

    store.selectionState.send({ type: "Start", taskId });
    const result = await sdk.backend.getRequestResponse(task.requestID);
    if (result.kind !== "Success") {
      store.selectionState.send({ type: "Error", taskId, error: result.error });
      return;
    }

    store.selectionState.send({
      type: "Success",
      taskId,
      request: {
        id: result.value.request.id,
        raw: result.value.request.raw,
      },
      response: {
        id: result.value.response.id,
        raw: result.value.response.raw,
      },
    });
  };

  const selectionState = computed(() => store.selectionState.getState());
  return {
    getState,
    initialize,
    clearQueue,
    selectTask,
    selectionState,
  };
});
