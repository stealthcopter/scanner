<script setup lang="ts">
import Card from "primevue/card";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { computed, ref } from "vue";

import { SessionItem } from "./SessionItem";
import { useTable } from "./useTable";

import { type SessionsState } from "@/types/scanner";

const props = defineProps<{
  state: SessionsState & { type: "Success" };
}>();

const search = ref("");
const statusFilter = ref("all");

const statusOptions = [
  { label: "All Sessions", value: "all" },
  { label: "Running", value: "running" },
  { label: "Finished", value: "finished" },
];

const { getFilteredSessions } = useTable({ search, statusFilter });
const filteredSessions = computed(() =>
  getFilteredSessions(props.state.sessions),
);
</script>
<template>
  <Card
    class="h-full"
    :pt="{
      body: { class: 'h-full p-0' },
      content: { class: 'h-full flex flex-col' },
    }"
  >
    <template #content>
      <div class="flex justify-between items-center p-4 gap-4">
        <div class="flex-1">
          <h3 class="text-lg font-semibold">Sessions</h3>
          <p class="text-sm text-surface-300 flex-1">
            Active and completed vulnerability scanning sessions.
          </p>
        </div>

        <div class="flex gap-2 items-center">
          <Select
            v-model="statusFilter"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="Filter by status"
            class="w-40"
          />

          <IconField>
            <InputIcon class="fas fa-magnifying-glass" />
            <InputText
              v-model="search"
              placeholder="Search sessions"
              class="w-full"
            />
          </IconField>
        </div>
      </div>

      <div
        class="flex flex-col overflow-y-auto"
        :class="{ 'h-full': filteredSessions.length === 0 }"
      >
        <SessionItem
          v-for="session in filteredSessions"
          :key="session.id"
          :session="session"
        />
      </div>
    </template>
  </Card>
</template>
