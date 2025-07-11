<script setup lang="ts">
import Button from "primevue/button";
import TabPanel from "primevue/tabpanel";
import TabView from "primevue/tabview";

import { useStepper } from "./useStepper";

import { provideSDK } from "@/plugins/sdk";
import { useLauncher } from "@/stores/launcher";
import { type FrontendSDK } from "@/types";

const {
  steps,
  currentStepIndex,
  canGoPrevious,
  isLastStep,
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
  <div class="w-[900px] h-[550px] flex flex-col gap-2">
    <TabView v-model:active-index="currentStepIndex" class="h-full">
      <TabPanel v-for="step in steps" :key="step.id" :header="step.label">
        <component :is="step.component" />
      </TabPanel>
    </TabView>
    <div class="flex items-center justify-end gap-2">
      <Button
        v-if="canGoPrevious"
        label="Previous"
        icon="fas fa-chevron-left"
        severity="info"
        outlined
        @click="goPrevious"
      />
      <Button
        v-if="!isLastStep"
        label="Next"
        icon="fas fa-chevron-right"
        icon-pos="right"
        severity="info"
        outlined
        @click="goNext"
      />
      <Button
        label="Run Scan"
        icon="fas fa-play"
        severity="success"
        @click="launcher.onSubmit(props.sdk, props.incrementCount)"
      />
    </div>
  </div>
</template>
