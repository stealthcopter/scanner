<script setup lang="ts">
import Empty from "./Empty.vue";
import Table from "./Table.vue";

import { useLauncher } from "@/stores/launcher";

const { form } = useLauncher();
</script>

<template>
  <Empty v-if="form.targets.length === 0" />
  <Table v-else />
</template>
