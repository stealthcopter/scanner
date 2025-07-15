import { computed, ref } from "vue";

import { ConfigStep } from "./ConfigStep";
import { TargetsStep } from "./TargetsStep";

type Step = "targets" | "configuration" ;

export const useStepper = () => {
  const currentStepIndex = ref(0);

  const steps = [
    {
      id: "targets",
      label: "Targets",
      component: TargetsStep,
    },
    {
      id: "configuration",
      label: "Configuration",
      component: ConfigStep,
    }
  ];

  const activeStep = computed(
    () => steps[currentStepIndex.value]?.id ?? "targets",
  );

  const currentStep = computed(() => steps[currentStepIndex.value]);

  const canGoNext = computed(() => {
    return currentStepIndex.value < steps.length - 1;
  });

  const canGoPrevious = computed(() => {
    return currentStepIndex.value > 0;
  });

  const isLastStep = computed(() => {
    return currentStepIndex.value === steps.length - 1;
  });

  const setActiveStep = (stepId: Step) => {
    const index = steps.findIndex((step) => step.id === stepId);
    if (index !== -1) {
      currentStepIndex.value = index;
    }
  };

  const goNext = () => {
    if (canGoNext.value) {
      currentStepIndex.value++;
    }
  };

  const goPrevious = () => {
    if (canGoPrevious.value) {
      currentStepIndex.value--;
    }
  };

  return {
    activeStep,
    steps,
    currentStep,
    currentStepIndex,
    canGoPrevious,
    isLastStep,
    setActiveStep,
    goNext,
    goPrevious,
  };
};
