<script setup lang="ts">
import { computed } from "vue";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";

import { RequestEditor, ResponseEditor } from "@/components/common/editors";
import { QueueTable } from "@/components/queue/QueueTable";
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
</script>

<template>
  <div v-if="state.type === 'Success'" class="h-full">
    <Splitter layout="vertical" class="h-full">
      <SplitterPanel :size="80">
        <QueueTable :state="state" v-model:selection="selection" />
      </SplitterPanel>

      <SplitterPanel :size="20" v-if="selection !== undefined">
        <Splitter layout="horizontal">
          <SplitterPanel :size="50">
            <RequestEditor :selectionState="queueService.selectionState" />
          </SplitterPanel>
          <SplitterPanel :size="50">
            <ResponseEditor :selectionState="queueService.selectionState" />
          </SplitterPanel>
        </Splitter>
      </SplitterPanel>
    </Splitter>
  </div>
  <InvalidState v-else />
</template>
