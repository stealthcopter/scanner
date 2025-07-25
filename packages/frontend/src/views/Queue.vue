<script setup lang="ts">
import { computed } from "vue";

import { QueueTable } from "@/components/queue";
import { useQueueService } from "@/services/queue";

const queueService = useQueueService();
const state = computed(() => queueService.getState());
</script>

<template>
  <div class="h-full flex flex-col gap-1">
    <QueueTable v-if="state.type === 'Success'" :state="state" />
  </div>
</template>
