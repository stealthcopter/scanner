import { defineStore } from "pinia";

import { useQueueState } from "@/stores/queue/useQueueState";
import { useSelectionState } from './useSelectionState';

export const useQueueStore = defineStore("stores.queue", () => {
  return {
    ...useQueueState(),
    ...useSelectionState(),
  };
});
