<script setup lang="ts">
import { computed } from "vue";

import { ChecksTable } from "@/components/checks/ChecksTable";
import { useChecksService } from "@/services/checks";
import { useConfigService } from "@/services/config";

const checksService = useChecksService();
const configService = useConfigService();

const checksState = computed(() => checksService.getState());
const configState = computed(() => configService.getState());
</script>

<template>
  <ChecksTable :checks-state="checksState" :config-state="configState" />
</template>
