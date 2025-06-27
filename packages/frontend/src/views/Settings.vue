<script setup lang="ts">
import Card from "primevue/card";
</script>

<template>
  <Card
    class="h-full"
    :pt="{ body: { class: 'h-full' }, content: { class: 'flex-1 min-h-0' } }"
  >
    <template #content> </template>
  </Card>
</template>
