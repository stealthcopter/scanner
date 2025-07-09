<script setup lang="ts">
import { computed } from "vue";

import { SessionsList } from "@/components/dashboard";
import { useScannerService } from "@/services/scanner";

const scannerService = useScannerService();
const scannerState = computed(() => scannerService.getState());
</script>

<template>
  <SessionsList :scanner-state="scannerState" />
</template>
