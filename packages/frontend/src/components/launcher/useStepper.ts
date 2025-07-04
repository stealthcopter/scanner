import { Component, computed, ref } from "vue";
import { ConfigStep } from "./ConfigStep";
import { TargetsStep } from "./TargetsStep";

type Step = "targets" | "configuration";

type StepDefinition = {
  id: Step;
  label: string;
  description: string;
  icon: string;
  component: Component;
};

export const useStepper = () => {
  const activeStep = ref<Step>("targets");

  const steps: StepDefinition[] = [
    {
      id: "targets",
      label: "Targets",
      description: "Review and delete targets you don't want to include in the scan. Multi-select is supported.",
      icon: "fas fa-bullseye",
      component: TargetsStep,
    },
    {
      id: "configuration",
      label: "Configuration",
      description: "Configure the scan parameters.",
      icon: "fas fa-cog",
      component: ConfigStep,
    },
  ];

  const currentStepIndex = computed(() => {
    return steps.findIndex((step) => step.id === activeStep.value);
  });

  const currentStep = computed(() => {
    return steps.find((step) => step.id === activeStep.value);
  });

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
    activeStep.value = stepId;
  };

  const goNext = () => {
    if (canGoNext.value) {
      const nextIndex = currentStepIndex.value + 1;
      const nextStep = steps[nextIndex];
      if (nextStep) {
        activeStep.value = nextStep.id;
      }
    }
  };

  const goPrevious = () => {
    if (canGoPrevious.value) {
      const prevIndex = currentStepIndex.value - 1;
      const prevStep = steps[prevIndex];
      if (prevStep) {
        activeStep.value = prevStep.id;
      }
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
