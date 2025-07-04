<script setup lang="ts">
import { ScanStrength } from "engine";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import SelectButton from "primevue/selectbutton";
import ToggleSwitch from "primevue/toggleswitch";
import { computed, ref } from "vue";
import { formatDuration } from "date-fns";

import { useLauncher } from "@/stores/launcher";

const { form } = useLauncher();

const strengthOptions = ref([
  { label: "Low", value: ScanStrength.LOW },
  { label: "Medium", value: ScanStrength.MEDIUM },
  { label: "High", value: ScanStrength.HIGH },
]);

const formatTimeout = computed(() => {
  const seconds = form.config.scanTimeout;
  if (isNaN(seconds) || seconds < 0) {
    return "";
  }

  return formatDuration({ seconds });
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
      <label class="block text-sm font-medium"
        >Scan Timeout ({{ formatTimeout }})</label
      >
      <InputNumber
        v-model="form.config.scanTimeout"
        :min="1"
        class="w-full"
        placeholder="600"
      />
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
