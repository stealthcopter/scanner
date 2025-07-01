import { ScanStrength } from "engine";
import { computed, type Ref } from "vue";

import { useConfigService } from "@/services/config";
import { type ConfigState } from "@/types/config";

export const useForm = (state: Ref<ConfigState & { type: "Success" }>) => {
  const configService = useConfigService();

  const strengthOptions = [
    { label: "Low", value: ScanStrength.LOW },
    { label: "Medium", value: ScanStrength.MEDIUM },
    { label: "High", value: ScanStrength.HIGH },
  ];

  const passiveEnabled = computed({
    get: () => state.value.config.passive.enabled,
    set: async (value: boolean) => {
      await configService.updateConfig({
        passive: { enabled: value },
      });
    },
  });

  const passiveStrength = computed({
    get: () => state.value.config.passive.strength,
    set: async (value: ScanStrength) => {
      await configService.updateConfig({
        passive: { strength: value },
      });
    },
  });

  const passiveInScopeOnly = computed({
    get: () => state.value.config.passive.inScopeOnly,
    set: async (value: boolean) => {
      await configService.updateConfig({
        passive: { inScopeOnly: value },
      });
    },
  });

  return {
    passiveEnabled,
    passiveStrength,
    passiveInScopeOnly,
    strengthOptions,
  };
};
