<script setup lang="ts">
import { ScanStrength } from "engine";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import SelectButton from "primevue/selectbutton";
import ToggleSwitch from "primevue/toggleswitch";
import { computed, ref } from "vue";

import { useLauncher } from "@/stores/launcher";

const { form } = useLauncher();

const strengthOptions = ref([
  { label: "Low", value: ScanStrength.LOW },
  { label: "Medium", value: ScanStrength.MEDIUM },
  { label: "High", value: ScanStrength.HIGH },
]);

const readableTimeout = computed(() => {
  const timeout = form.config.scanTimeout;
  if (!timeout || timeout <= 0) {
    return "";
  }

  const days = Math.floor(timeout / (24 * 3600));
  const hours = Math.floor((timeout % (24 * 3600)) / 3600);
  const minutes = Math.floor((timeout % 3600) / 60);
  const seconds = timeout % 60;

  const parts = [];
  if (days > 0) {
    parts.push(`${days} day${days > 1 ? "s" : ""}`);
  }
  if (hours > 0) {
    parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
  }
  if (seconds > 0) {
    parts.push(`${seconds} second${seconds > 1 ? "s" : ""}`);
  }

  return parts.join(" ");
});
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium mb-2">Scan Title</label>
      <InputText
        v-model="form.title"
        placeholder="Enter a descriptive title for this scan"
        class="w-full"
      />
      <p class="text-xs text-surface-400 mt-1">
        Give your scan a meaningful name to help identify it later
      </p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium">Scan Strength</label>
      <SelectButton
        v-model="form.config.strength"
        :options="strengthOptions"
        option-label="label"
        option-value="value"
      />
      <p class="text-xs text-surface-400">
        Controls the aggressiveness of active scanning checks. Higher means more
        thorough but slower scanning.
      </p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium">Concurrency</label>
      <InputNumber
        v-model="form.config.concurrency"
        :min="1"
        :max="100"
        class="w-full"
      />
      <p class="text-xs text-surface-400">
        Limit the number of concurrent requests to avoid overwhelming the target
      </p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium">Scan Timeout</label>
      <InputNumber
        :model-value="form.config.scanTimeout"
        @input="form.config.scanTimeout = $event.value"
        :min="1"
        class="w-full"
        placeholder="600"
      />
      <p
        v-if="readableTimeout"
        class="text-xs text-surface-400"
      >
        Equals to: {{ readableTimeout }}
      </p>
      <p class="text-xs text-surface-400">
        Maximum time to wait for the entire scan to complete before timing out
      </p>
    </div>

    <div class="flex items-center justify-between">
      <div>
        <label class="block text-sm font-medium mb-1">In-Scope Only</label>
        <p class="text-xs text-surface-400">
          Only scan requests that are within the defined scope
        </p>
      </div>
      <ToggleSwitch v-model="form.config.inScopeOnly" />
    </div>
  </div>
</template>
