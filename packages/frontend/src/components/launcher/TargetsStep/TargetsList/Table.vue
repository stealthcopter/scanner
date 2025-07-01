<script setup lang="ts">
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import { useLauncher } from "@/stores/launcher";
import { ref, computed } from "vue";
import { useSDK } from "@/plugins/sdk";

const sdk = useSDK();
const launcher = useLauncher();
const { form } = launcher;

const selectedTargets = ref<
  {
    id: string;
  }[]
>([]);

const sortedTargets = computed(() => {
  return form.targets.sort((a, b) => a.host.localeCompare(b.host));
});

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
  selectedTargets.value = [];
};
</script>
<template>
  <div class="flex flex-col h-full">
    <div class="mb-2 flex justify-between items-center h-8 flex-shrink-0">
      <div class="text-sm text-surface-400">
        {{ sortedTargets.length }} unique requests
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
      :value="sortedTargets"
      :virtualScrollerOptions="{ itemSize: 44 }"
      scrollable
      stripedRows
      scrollHeight="flex"
      tableStyle="table-layout: fixed"
      selectionMode="multiple"
      :metaKeySelection="true"
      dataKey="id"
      class="flex-1"
    >
      <Column field="method" header="Method" style="width: 10%; height: 44px">
        <template #body="{ data }">
          <div class="text-sm truncate">{{ data.method }}</div>
        </template>
      </Column>
      <Column field="host" header="Host" style="width: 30%; height: 44px">
        <template #body="{ data }">
          <div class="text-sm font-medium truncate">
            {{ data.host }}:{{ data.port }}
          </div>
        </template>
      </Column>
      <Column field="path" header="Path" style="width: 35%; height: 44px">
        <template #body="{ data }">
          <div class="text-sm truncate">{{ data.path }}</div>
        </template>
      </Column>
      <Column field="query" header="Query" style="width: 35%; height: 44px">
        <template #body="{ data }">
          <div class="text-sm truncate">{{ data.query }}</div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
