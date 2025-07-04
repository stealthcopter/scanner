<script setup lang="ts">
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import { useLauncher } from "@/stores/launcher";
import { ref } from "vue";
import { useSDK } from "@/plugins/sdk";
import { BasicRequest } from "shared";

const sdk = useSDK();
const launcher = useLauncher();
const { form } = launcher;

const selectedTargets = ref<BasicRequest[]>([]);

const handleDeleteSelected = () => {
  const selectedIds = selectedTargets.value.map((target) => target.id);
  const remainingTargets = form.targets.filter(
    (target) => !selectedIds.includes(target.id)
  );

  if (remainingTargets.length === 0) {
    sdk.window.showToast(
      "Cannot delete all requests. At least one request must remain.",
      { variant: "warning" }
    );
    return;
  }

  form.targets = remainingTargets;
};
</script>
<template>
  <div class="flex flex-col h-full">
    <div class="mb-2 flex justify-between items-center h-8 flex-shrink-0">
      <div class="text-sm text-surface-400">
        {{ form.targets.length }} unique requests
      </div>
      <div class="h-8 flex items-center">
        <Button
          v-if="selectedTargets.length > 0"
          icon="fas fa-trash"
          severity="danger"
          size="small"
          :label="`Delete ${selectedTargets.length} selected`"
          @click="handleDeleteSelected"
        />
      </div>
    </div>
    <DataTable
      v-model:selection="selectedTargets"
      :value="form.targets"
      scrollable
      stripedRows
      scrollHeight="25rem"
      tableStyle="table-layout: fixed"
      selectionMode="multiple"
      :metaKeySelection="true"
      dataKey="id"
      class="flex-1"
    >
      <Column field="method" header="Method" style="width: 10%">
        <template #body="{ data }">
          <div class="text-sm truncate">{{ data.method }}</div>
        </template>
      </Column>
      <Column field="host" header="Host" style="width: 30%">
        <template #body="{ data }">
          <div class="text-sm font-medium truncate">
            {{ data.host }}:{{ data.port }}
          </div>
        </template>
      </Column>
      <Column field="path" header="Path" style="width: 35%">
        <template #body="{ data }">
          <div class="text-sm truncate">{{ data.path }}</div>
        </template>
      </Column>
      <Column field="query" header="Query" style="width: 35%">
        <template #body="{ data }">
          <div class="text-sm truncate">{{ data.query }}</div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
