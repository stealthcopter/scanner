<script setup lang="ts">
import Button from "primevue/button";
import { useStepper } from "./useStepper";
import { useLauncher } from "@/stores/launcher";
import { FrontendSDK } from "@/types";
import { provideSDK } from "@/plugins/sdk";

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
}>();

provideSDK(props.sdk);

const launcher = useLauncher();
</script>

<template>
  <div class="flex w-[900px] h-[550px]" id="launcher_dialog">
    <!-- Sidebar Navigation -->
    <div class="w-48 p-2">
      <nav class="space-y-2">
        <Button
          v-for="step in steps"
          :key="step.id"
          :label="step.label"
          :icon="step.icon"
          @click="setActiveStep(step.id)"
          :severity="activeStep === step.id ? 'secondary' : 'info'"
          :outlined="activeStep !== step.id"
          class="w-full justify-start"
        />
      </nav>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col px-4">
      <!-- Header -->
      <div class="py-2">
        <h1 class="text-xl font-semibold text-gray-100 m-0">
          {{ currentStep?.label }}
        </h1>
        <p class="text-sm text-gray-400">
          {{ currentStep?.description }}
        </p>
      </div>

      <!-- Step Content -->
      <div class="flex-1 overflow-auto">
        <component :is="currentStep?.component" />
      </div>

      <!-- Footer Actions -->
      <div class="py-2">
        <div class="flex items-center justify-between">
          <Button
            v-if="canGoPrevious"
            label="Previous"
            icon="fas fa-chevron-left"
            @click="goPrevious"
            severity="info"
            outlined
          />
          <div v-else></div>

          <div class="flex space-x-3">
            <Button
              v-if="!isLastStep"
              label="Next"
              icon="fas fa-chevron-right"
              iconPos="right"
              @click="goNext"
              severity="info"
            />
            <Button
              v-else
              label="Run Scan"
              icon="fas fa-play"
              @click="launcher.onSubmit(props.sdk)"
              severity="success"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
