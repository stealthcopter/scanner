<script setup lang="ts">
import Card from "primevue/card";
import { computed } from "vue";

import CaidoTab from "@/components/common/CaidoTab.vue";
import { SessionItem } from "./SessionItem";
import { useScannerService } from "@/services/scanner";

import { type SessionsState } from "@/types/scanner";
import None from "./None.vue";

defineProps<{
  state: SessionsState & { type: "Success" };
}>();

const scannerService = useScannerService();

const selectedSession = computed(() => scannerService.getSelectedSession());

const handleTabSelect = (sessionId: string) => {
  scannerService.selectSession(sessionId);
};

const handleRename = async (sessionId: string, newName: string) => {
  await scannerService.updateSessionTitle(sessionId, newName);
};
</script>

<template>
  <div class="flex flex-col h-full gap-1">
    <Card
      class="h-fit"
      :pt="{
        body: { class: 'h-fit p-0' },
        content: { class: 'h-fit flex flex-col' },
      }"
    >
      <template #content>
        <div class="flex justify-between items-center p-4">
          <div>
            <h3 class="text-lg font-semibold">Sessions</h3>
            <p class="text-sm text-surface-300">
              Active and completed vulnerability scanning sessions.
            </p>
          </div>
        </div>
      </template>
    </Card>

    <Card
      v-if="state.sessions.length > 0"
      class="h-fit"
      :pt="{
        body: { class: 'h-fit p-0' },
        content: { class: 'h-fit flex flex-col' },
      }"
    >
      <template #content>
        <div class="flex gap-2 p-4 overflow-x-auto">
          <CaidoTab
            v-for="session in state.sessions"
            :key="session.id"
            :is-selected="selectedSession?.id === session.id"
            :label="session.title"
            :status="session.kind"
            @select="handleTabSelect(session.id)"
            @rename="(newName: string) => handleRename(session.id, newName)"
          />
        </div>
      </template>
    </Card>

    <Card
      v-if="state.sessions.length > 0"
      class="flex-1"
      :pt="{
        body: { class: 'h-full p-0' },
        content: { class: 'h-full flex flex-col' },
      }"
    >
      <template #content>
        <div class="h-full">
          <SessionItem
            v-if="selectedSession"
            :key="selectedSession.id"
            :session="selectedSession"
          />
        </div>
      </template>
    </Card>
    <None v-else />
  </div>
</template>
