<script setup lang="ts">
import { computed } from "vue";

import { Editors } from "@/components/common/editors";
import { QueueTable } from "@/components/queue";
import { useQueueService } from "@/services/queue";

const queueService = useQueueService();
const state = computed(() => queueService.getState());
const selection = computed({
  get: () => {
    if (state.value.type !== "Success") return undefined;

    const selectionState = queueService.selectionState;
    if (selectionState.type === "None") return undefined;

    const taskId = selectionState.taskId;
    return state.value.tasks.find((t) => t.id === taskId);
  },
  set: (selection) => {
    queueService.selectTask(selection?.id ?? "");
  },
});

const selectedRequestID = computed(() => selection.value?.requestID);
</script>

<template>
  <div class="h-full flex flex-col gap-1">
    <div class="w-full h-1/2">
      <QueueTable
        v-if="state.type === 'Success'"
        :state="state"
        v-model:selection="selection"
      />
    </div>

    <div class="w-full h-1/2 flex flex-col gap-1">
      <div class="w-full flex-1 min-h-0">
        <Editors :request-id="selectedRequestID" />
      </div>
    </div>
  </div>
</template>
