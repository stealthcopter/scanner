<script setup lang="ts">
import Button from "primevue/button";

import { useStepper } from "./useStepper";

import { provideSDK } from "@/plugins/sdk";
import { useLauncher } from "@/stores/launcher";
import { type FrontendSDK } from "@/types";

const {
  activeStep,
  steps,
  currentStep,
  canGoPrevious,
  isLastStep,
  setActiveStep,
  goNext,
  goPrevious,
} = useStepper();

const props = defineProps<{
  sdk: FrontendSDK;
  incrementCount: () => void;
}>();

provideSDK(props.sdk);

const launcher = useLauncher();
</script>

<template>
  <div class="flex w-[900px] h-[500px] gap-4">
    <div class="w-48">
      <nav class="space-y-2">
        <Button
          v-for="step in steps"
          :key="step.id"
          :label="step.label"
          :icon="step.icon"
          :severity="activeStep === step.id ? 'secondary' : 'info'"
          :outlined="activeStep !== step.id"
          class="w-full justify-start"
          @click="setActiveStep(step.id)"
        />
      </nav>
    </div>

    <div class="flex-1 flex flex-col gap-2">
      <div>
        <h1 class="text-xl font-semibold text-gray-100 m-0">
          {{ currentStep?.label }}
        </h1>
        <p class="text-sm text-gray-400">
          {{ currentStep?.description }}
        </p>
      </div>

      <div class="flex-1">
        <component :is="currentStep?.component" />
      </div>

      <div>
        <div class="flex items-center justify-between">
          <Button
            v-if="canGoPrevious"
            label="Previous"
            icon="fas fa-chevron-left"
            severity="info"
            outlined
            @click="goPrevious"
          />
          <div v-else></div>

          <div class="flex space-x-3">
            <Button
              v-if="!isLastStep"
              label="Next"
              icon="fas fa-chevron-right"
              icon-pos="right"
              severity="info"
              @click="goNext"
            />
            <Button
              v-else
              label="Run Scan"
              icon="fas fa-play"
              severity="success"
              @click="launcher.onSubmit(props.sdk, props.incrementCount)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
