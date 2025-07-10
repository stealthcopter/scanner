<script setup lang="ts">
import Failed from "./Failed.vue";
import Loading from "./Loading.vue";
import None from "./None.vue";
import Success from "./Success.vue";

import InvalidState from "@/components/common/InvalidState.vue";
import { type SessionsState } from "@/types/scanner";

defineProps<{
  scannerState: SessionsState;
}>();
</script>

<template>
  <Loading v-if="scannerState.type === 'Loading'" />
  <Failed v-else-if="scannerState.type === 'Error'" />
  <None
    v-else-if="
      scannerState.type === 'Success' && scannerState.sessions.length === 0
    "
  />
  <Success v-else-if="scannerState.type === 'Success'" :state="scannerState" />
  <InvalidState v-else />
</template>
