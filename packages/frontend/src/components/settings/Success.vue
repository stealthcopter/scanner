<script setup lang="ts">
import { ScanAggressivity, Severity } from "engine";
import Card from "primevue/card";
import InputNumber from "primevue/inputnumber";
import SelectButton from "primevue/selectbutton";
import ToggleSwitch from "primevue/toggleswitch";
import { computed, toRefs } from "vue";

import { useForm } from "./useForm";

import { type ConfigState } from "@/types/config";

const props = defineProps<{
  state: ConfigState & { type: "Success" };
}>();

const { state } = toRefs(props);

const {
  passiveEnabled,
  passiveAggressivity,
  passiveInScopeOnly,
  passiveSeverities,
  passiveConcurrentScans,
  passiveConcurrentRequests,
} = useForm(state);

const severityOptions = computed(() =>
  Object.values(Severity).map((severity) => ({
    label: severity.charAt(0).toUpperCase() + severity.slice(1),
    value: severity,
  })),
);

const aggressivityOptions = computed(() =>
  Object.values(ScanAggressivity).map((aggressivity) => ({
    label: aggressivity.charAt(0).toUpperCase() + aggressivity.slice(1),
    value: aggressivity,
  })),
);
</script>

<template>
  <div class="flex flex-col h-full gap-1 overflow-y-auto">
    <Card
      class="h-fit"
      :pt="{
        body: { class: 'h-fit p-0' },
        content: { class: 'h-fit flex flex-col' },
      }"
    >
      <template #content>
        <div class="flex justify-between items-center p-4">
          <div>
            <h3 class="text-lg font-semibold">Settings</h3>
            <p class="text-sm text-surface-300">
              Configure passive and active scanner settings
            </p>
          </div>
        </div>
      </template>
    </Card>

    <Card
      class="h-full"
      :pt="{
        body: { class: 'h-full p-0' },
        content: { class: 'h-full flex flex-col' },
      }"
    >
      <template #content>
        <div class="flex flex-col gap-6 p-4">
          <div class="flex flex-col gap-4">
            <h4 class="text-md font-medium text-surface-300">
              Passive Scanner
            </h4>

            <div class="flex items-start justify-between gap-4">
              <div class="flex flex-col gap-1 flex-1">
                <label class="text-sm font-medium"
                  >Enable Passive Scanner</label
                >
                <p class="text-xs text-surface-400">
                  When enabled, the scanner will automatically analyze HTTP
                  traffic for vulnerabilities
                </p>
              </div>
              <div class="flex-shrink-0">
                <ToggleSwitch v-model="passiveEnabled" />
              </div>
            </div>

            <div class="flex items-start justify-between gap-4">
              <div class="flex flex-col gap-1 flex-1">
                <label class="text-sm font-medium">In-Scope Only</label>
                <p class="text-xs text-surface-400">
                  When enabled, the scanner will only analyze requests that are
                  in scope
                </p>
              </div>
              <div class="flex-shrink-0">
                <ToggleSwitch
                  v-model="passiveInScopeOnly"
                  :disabled="!passiveEnabled"
                />
              </div>
            </div>

            <div class="flex items-start justify-between gap-4">
              <div class="flex flex-col gap-1 flex-1">
                <label class="text-sm font-medium">Scans Concurrency</label>
                <p class="text-xs text-surface-400">
                  Number of scans that can run simultaneously
                </p>
              </div>
              <div class="flex-shrink-0">
                <InputNumber
                  v-model="passiveConcurrentScans"
                  :min="1"
                  :max="30"
                  :disabled="!passiveEnabled"
                />
              </div>
            </div>

            <div class="flex items-start justify-between gap-4">
              <div class="flex flex-col gap-1 flex-1">
                <label class="text-sm font-medium">Requests Concurrency</label>
                <p class="text-xs text-surface-400">
                  Number of requests to send simultaneously during single scan
                  execution
                </p>
              </div>
              <div class="flex-shrink-0">
                <InputNumber
                  v-model="passiveConcurrentRequests"
                  :min="1"
                  :max="100"
                  :disabled="!passiveEnabled"
                />
              </div>
            </div>

            <div class="flex items-start justify-between gap-4">
              <div class="flex flex-col gap-1 flex-1">
                <label class="text-sm font-medium">Scan Aggressivity</label>
                <p class="text-xs text-surface-400">
                  Controls the aggressiveness of passive scanning checks. Lower
                  means faster scanning, less requests, but less accurate.
                </p>
              </div>
              <div class="flex-shrink-0">
                <SelectButton
                  v-model="passiveAggressivity"
                  :options="aggressivityOptions"
                  option-label="label"
                  option-value="value"
                  :disabled="!passiveEnabled"
                />
              </div>
            </div>

            <div class="flex items-start justify-between gap-4">
              <div class="flex flex-col gap-1 flex-1">
                <label class="text-sm font-medium">Severities</label>
                <p class="text-xs text-surface-400">
                  Select which severity levels to include in passive scanning
                </p>
              </div>
              <div class="flex-shrink-0">
                <SelectButton
                  v-model="passiveSeverities"
                  :options="severityOptions"
                  option-label="label"
                  option-value="value"
                  :disabled="!passiveEnabled"
                  multiple
                />
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
