import { type ScanAggressivity, type Severity } from "engine";
import { computed, type Ref } from "vue";

import { useConfigService } from "@/services/config";
import { type ConfigState } from "@/types/config";

export const useForm = (state: Ref<ConfigState & { type: "Success" }>) => {
  const configService = useConfigService();

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

  const passiveConcurrentScans = computed({
    get: () => state.value.config.passive.concurrentChecks,
    set: async (value: number) => {
      await configService.updateConfig({
        passive: { concurrentChecks: value },
      });
    },
  });

  const passiveConcurrentRequests = computed({
    get: () => state.value.config.passive.concurrentRequests,
    set: async (value: number) => {
      await configService.updateConfig({
        passive: { concurrentRequests: value },
      });
    },
  });

  const passiveSeverities = computed({
    get: () => state.value.config.passive.severities,
    set: async (value: Severity[]) => {
      await configService.updateConfig({
        passive: { severities: value },
      });
    },
  });

  return {
    passiveEnabled,
    passiveAggressivity,
    passiveInScopeOnly,
    passiveConcurrentScans,
    passiveConcurrentRequests,
    passiveSeverities,
  };
};
