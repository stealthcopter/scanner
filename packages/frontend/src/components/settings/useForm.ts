import { ScanAggressivity } from "engine";
import { computed, type Ref } from "vue";

import { useConfigService } from "@/services/config";
import { type ConfigState } from "@/types/config";

export const useForm = (state: Ref<ConfigState & { type: "Success" }>) => {
  const configService = useConfigService();

  const aggressivityOptions = [
    { label: "Low", value: ScanAggressivity.LOW },
    { label: "Medium", value: ScanAggressivity.MEDIUM },
    { label: "High", value: ScanAggressivity.HIGH },
  ];

  const passiveEnabled = computed({
    get: () => state.value.config.passive.enabled,
    set: async (value: boolean) => {
      await configService.updateConfig({
        passive: { enabled: value },
      });
    },
  });

  const passiveAggressivity = computed({
    get: () => state.value.config.passive.aggressivity,
    set: async (value: ScanAggressivity) => {
      await configService.updateConfig({
        passive: { aggressivity: value },
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

  const passiveScansConcurrency = computed({
    get: () => state.value.config.passive.scansConcurrency,
    set: async (value: number) => {
      await configService.updateConfig({
        passive: { scansConcurrency: value },
      });
    },
  });

  return {
    passiveEnabled,
    passiveAggressivity,
    passiveInScopeOnly,
    passiveScansConcurrency,
    aggressivityOptions,
  };
};
