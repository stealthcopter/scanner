<script setup lang="ts">
import { computed } from "vue";

import None from "./None.vue";
import Success from "./Success.vue";

import { useScannerService } from "@/services/scanner";

const scannerService = useScannerService();
const session = computed(() => scannerService.getSelectedSession());
</script>

<template>
  <Success v-if="session" :session="session" />
  <None v-else />
</template>
