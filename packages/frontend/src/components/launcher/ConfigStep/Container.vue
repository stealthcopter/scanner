<script setup lang="ts">
import { ScanStrength } from "engine";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import ToggleSwitch from "primevue/toggleswitch";
import { computed, ref } from "vue";

import { useLauncher } from "@/stores/launcher";

const { form } = useLauncher();

const scanTimeoutInput = ref<string>("300");

const strengthOptions = ref([
  { label: "Low", value: ScanStrength.LOW },
  { label: "Medium", value: ScanStrength.MEDIUM },
  { label: "High", value: ScanStrength.HIGH },
]);

const formatTimeout = computed(() => {
  const seconds = Number(scanTimeoutInput.value);
  if (isNaN(seconds) || seconds < 0) {
    return "";
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${seconds} seconds`;
  } else if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
  }
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
      <Select
        v-model="form.config.strength"
        :options="strengthOptions"
        option-label="label"
        option-value="value"
        placeholder="Select Item"
        class="w-full"
        :pt="{
          overlay: {
            style: {
              zIndex: 5000,
            },
          },
        }"
      />
      <p class="text-xs text-surface-400">
        Controls the aggressiveness of active scanning checks. Higher means more
        thorough but slower scanning.
      </p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium">Max Requests/Second</label>
      <InputNumber
        v-model="form.config.maxRequestsPerSecond"
        :min="1"
        :max="100"
        class="w-full"
      />
      <p class="text-xs text-surface-400">
        Limit the number of requests sent per second to avoid overwhelming the
        target
      </p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium"
        >Scan Timeout ({{ formatTimeout }})</label
      >
      <InputText
        v-model="scanTimeoutInput"
        class="w-full"
        inputmode="numeric"
        pattern="[0-9]*"
        :placeholder="'300'"
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
