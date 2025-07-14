<script setup lang="ts">
import { ScanAggressivity, Severity } from "engine";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import SelectButton from "primevue/selectbutton";
import ToggleSwitch from "primevue/toggleswitch";

import { useForm } from "./useForm";

const { form, readableTimeout } = useForm();

const aggressivityOptions = Object.values(ScanAggressivity).map(
  (aggressivity) => ({
    label: aggressivity.charAt(0).toUpperCase() + aggressivity.slice(1),
    value: aggressivity,
  }),
);

const severityOptions = Object.values(Severity).map((severity) => ({
  label: severity.charAt(0).toUpperCase() + severity.slice(1),
  value: severity,
}));
</script>

<template>
  <div class="w-full space-y-8 py-3">
    <div class="grid grid-cols-2 gap-8">
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium mb-2">Scan Title</label>
          <InputText
            v-model="form.title"
            placeholder="Enter scan title"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2"
            >Scan Aggressivity</label
          >
          <SelectButton
            v-model="form.config.aggressivity"
            :options="aggressivityOptions"
            option-label="label"
            option-value="value"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Severities</label>
          <SelectButton
            v-model="form.config.severities"
            :options="severityOptions"
            option-label="label"
            option-value="value"
            multiple
            class="w-full"
          />
        </div>
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium">In-Scope Only</label>
          <ToggleSwitch v-model="form.config.inScopeOnly" />
        </div>
      </div>

      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium mb-2">Checks Concurrency</label>
          <InputNumber
            v-model="form.config.concurrentChecks"
            :min="1"
            :max="100"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">
            Timeout (sec)
            <span v-if="readableTimeout" class="text-xs text-primary-400 ml-2">
              {{ readableTimeout }}
            </span>
          </label>
          <InputNumber
            :model-value="form.config.scanTimeout"
            :min="1"
            placeholder="600"
            class="w-full"
            @input="form.config.scanTimeout = $event.value"
          />
        </div>
      </div>
    </div>
  </div>
</template>
