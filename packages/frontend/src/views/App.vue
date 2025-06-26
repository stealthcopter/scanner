<script setup lang="ts">
import Card from "primevue/card";
import Panel from "primevue/panel";
import Tag from "primevue/tag";
import { computed, onMounted } from "vue";

import { useChecksService } from "@/services/checks";
import { useConfigService } from "@/services/config";
import { useScannerService } from "@/services/scanner";

const scannerService = useScannerService();
const checksService = useChecksService();
const configService = useConfigService();

onMounted(() => {
  scannerService.initialize();
  checksService.initialize();
  configService.initialize();
});

const scannerStateForDisplay = computed(() => {
  const state = scannerService.getState();
  if ("sessions" in state && state.sessions !== undefined) {
    return {
      ...state,
      sessions: Object.fromEntries(state.sessions.entries()),
    };
  }
  return state;
});
</script>
<template>
  <Card
    class="h-full"
    :pt="{
      body: { class: 'h-full overflow-y-auto' },
      content: { class: 'flex-1 min-h-0 p-2' },
    }"
  >
    <template #header> </template>

    <template #content>
      <div class="flex flex-col gap-4 h-full min-h-0">
        <Panel header="Scanner Service" toggleable>
          <div class="flex items-center gap-2 mb-3">
            <span class="font-semibold">Status:</span>
            <Tag :value="scannerStateForDisplay.type" />
          </div>
          <pre class="text-sm p-3 rounded">{{ scannerStateForDisplay }}</pre>
        </Panel>

        <Panel header="Config Service" toggleable>
          <div class="flex items-center gap-2 mb-3">
            <span class="font-semibold">Status:</span>
            <Tag :value="configService.getState().type" />
          </div>
          <pre class="text-sm p-3 rounded">{{ configService.getState() }}</pre>
        </Panel>

        <Panel header="Checks Service" toggleable>
          <div class="flex items-center gap-2 mb-3">
            <span class="font-semibold">Status:</span>
            <Tag :value="checksService.getState().type" />
          </div>
          <pre class="text-sm p-3 rounded">{{ checksService.getState() }}</pre>
        </Panel>
      </div>
    </template>
  </Card>
</template>
