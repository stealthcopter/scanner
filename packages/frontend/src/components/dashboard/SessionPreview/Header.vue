<script setup lang="ts">
import Button from "primevue/button";
import { type Session } from "shared";

import { useForm } from "./useForm";

const props = defineProps<{
  session: Session;
}>();

const {
  getStatusColor,
  onCancel,
  onDelete,
  onExport,
  isCancelling,
  isDeleting,
} = useForm(props);
</script>

<template>
  <div class="flex items-center justify-between gap-4 px-4 pt-4">
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <span class="text-base font-medium">{{ session.title }}</span>
        <span class="text-xs text-surface-400 font-mono">{{ session.id }}</span>
      </div>
      <div class="flex items-center gap-2">
        <div
          :class="['w-2 h-2 rounded-full', getStatusColor(session.kind)]"
        ></div>
        <span
          :class="['text-xs rounded text-surface-100 uppercase tracking-wide']"
        >
          <span :class="{ shimmer: session.kind === 'Running' }">{{
            session.kind
          }}</span>
          <span
            v-if="session.kind === 'Interrupted' && session.reason"
            class="text-xs text-surface-400 normal-case ml-1"
          >
            ({{ session.reason }})
          </span>
        </span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <Button
        v-if="session.kind === 'Running'"
        label="Cancel"
        severity="danger"
        :loading="isCancelling"
        outlined
        size="small"
        @click="onCancel"
      />

      <Button
        label="Delete"
        severity="danger"
        :loading="isDeleting"
        outlined
        size="small"
        @click="onDelete"
      />

      <Button
        v-if="session.kind === 'Done'"
        label="Export"
        severity="secondary"
        outlined
        size="small"
        @click="onExport"
      />
    </div>
  </div>
</template>
