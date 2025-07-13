<script setup lang="ts">
import Card from "primevue/card";
</script>

<template>
  <Card
    class="h-full"
    :pt="{
      body: { class: 'h-full p-0' },
      content: { class: 'h-full flex flex-col' },
      title: { class: 'p-4 border-b border-surface-700' },
    }"
  >
    <template #content>
      <div
        class="flex-1 flex items-center justify-center flex-col gap-4 p-8 text-center"
      >
        <i class="fas fa-rocket text-surface-400 text-5xl" />

        <div class="flex flex-col gap-1">
          <h2 class="text-2xl font-semibold">No sessions found</h2>
          <p class="text-surface-400 max-w-sm">
            To get started, run the Scan Launcher by selecting requests to scan.
          </p>
        </div>
      </div>
    </template>
  </Card>
</template>
