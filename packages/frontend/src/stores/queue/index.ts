import { defineStore } from "pinia";

import { useSelectionState } from "./useSelectionState";

import { useQueueState } from "@/stores/queue/useQueueState";

export const useQueueStore = defineStore("stores.queue", () => {
  return {
    ...useQueueState(),
    ...useSelectionState(),
  };
});
