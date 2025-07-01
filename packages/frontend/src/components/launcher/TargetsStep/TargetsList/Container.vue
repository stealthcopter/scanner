<script setup lang="ts">
import { useLauncher } from "@/stores/launcher";
import Empty from "./Empty.vue";
import Table from "./Table.vue";

const { form } = useLauncher();
</script>

<template>
  <Empty v-if="form.targets.length === 0" />
  <Table v-else />
</template>
