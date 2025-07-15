<script setup lang="ts">
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import { type Session } from "shared";

import { useTable } from "./useTable";

const props = defineProps<{
  session: Session;
}>();

const { checksHistory } = useTable(props);
</script>

<template>
  <DataTable
    :value="checksHistory"
    scrollable
    striped-rows
    scroll-height="flex"
    table-style="table-layout: fixed"
    class="min-h-0"
  >
    <Column field="targetID" header="Target ID" style="width: 20%">
      <template #body="{ data }">
        <div class="text-sm font-mono truncate">{{ data.targetID }}</div>
      </template>
    </Column>
    <Column field="name" header="Check" style="width: 30%">
      <template #body="{ data }">
        <div class="text-sm truncate">{{ data.name }}</div>
      </template>
    </Column>
    <Column field="requestsSent" header="Requests Sent" style="width: 15%">
      <template #body="{ data }">
        <div class="text-sm font-mono">{{ data.requestsSent }}</div>
      </template>
    </Column>
    <Column field="findings" header="Findings" style="width: 15%">
      <template #body="{ data }">
        <div class="text-sm font-mono">{{ data.findings }}</div>
      </template>
    </Column>
    <Column field="status" header="Status" style="width: 20%">
      <template #body="{ data }">
        <div class="text-sm">
          <span :class="{ shimmer: data.status === 'Running' }">
            {{ data.status }}
          </span>
        </div>
      </template>
    </Column>
    <Column field="duration" header="Duration" style="width: 15%">
      <template #body="{ data }">
        <div class="text-sm font-mono">{{ data.duration }}</div>
      </template>
    </Column>
  </DataTable>
</template>
