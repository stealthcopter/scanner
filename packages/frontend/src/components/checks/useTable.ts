import type { CheckAggressivity, CheckMetadata } from "engine";
import type { DataTableFilterMeta } from "primevue/datatable";
import { computed, ref } from "vue";

import { useChecksService } from "@/services/checks";
import { useConfigService } from "@/services/config";

export const useTable = () => {
  const search = ref("");
  const expandedRows = ref([]);

  const checksService = useChecksService();
  const configService = useConfigService();

  const filters = computed<DataTableFilterMeta>(() => ({
    global: { value: search.value ?? "", matchMode: "contains" },
  }));

  const checks = computed(() => {
    const checksState = checksService.getState();
    if (checksState.type !== "Success") return [];

    return checksState.checks;
  });

  const getAggressivityText = (check: CheckMetadata) => {
    const { minRequests, maxRequests } = check.aggressivity;

    if (minRequests === 0 && maxRequests === 0) {
      return "No requests";
    }

    if (minRequests === maxRequests) {
      return `${minRequests} requests`;
    }

    if (maxRequests === "Infinity") {
      return `${minRequests}+ requests`;
    }

    return `${minRequests}–${maxRequests} requests`;
  };

  const getAggressivityBadgeClass = (aggressivity: CheckAggressivity) => {
    const { minRequests, maxRequests } = aggressivity;

    if (minRequests === 0 && maxRequests === 0) {
      return "text-surface-300";
    }

    if (maxRequests === "Infinity") {
      return "text-red-400";
    }

    if (maxRequests >= 10) {
      return "text-amber-300";
    }

    return "text-red-300";
  };

  const getPassiveEnabled = (check: CheckMetadata) => {
    const configState = configService.getState();
    if (configState.type !== "Success") return check.type === "passive";

    const config = configState.config;
    const overrideValue = config.passive.overrides.find(
      (o) => o.checkID === check.id,
    )?.enabled;

    return overrideValue !== undefined
      ? overrideValue
      : check.type === "passive";
  };

  const getActiveEnabled = (check: CheckMetadata) => {
    const configState = configService.getState();
    if (configState.type !== "Success") return true;

    const config = configState.config;
    const overrideValue = config.active.overrides.find(
      (o) => o.checkID === check.id,
    )?.enabled;
    return overrideValue !== undefined ? overrideValue : true;
  };

  const togglePassiveCheck = async (check: CheckMetadata) => {
    const configState = configService.getState();
    if (configState.type !== "Success") return;

    const config = configState.config;
    const currentValue = getPassiveEnabled(check);

    const existingOverrides = config.passive.overrides.filter(
      (o) => o.checkID !== check.id,
    );
    const newOverrides = [
      ...existingOverrides,
      { checkID: check.id, enabled: !currentValue },
    ];

    const update = {
      passive: {
        overrides: newOverrides,
      },
    };

    await configService.updateConfig(update);
  };

  const toggleActiveCheck = async (check: CheckMetadata) => {
    const configState = configService.getState();
    if (configState.type !== "Success") return;

    const config = configState.config;
    const currentValue = getActiveEnabled(check);

    const existingOverrides = config.active.overrides.filter(
      (o) => o.checkID !== check.id,
    );
    const newOverrides = [
      ...existingOverrides,
      { checkID: check.id, enabled: !currentValue },
    ];

    const update = {
      active: {
        overrides: newOverrides,
      },
    };

    await configService.updateConfig(update);
  };

  return {
    search,
    expandedRows,
    filters,
    checks,
    getPassiveEnabled,
    getActiveEnabled,
    getAggressivityText,
    getAggressivityBadgeClass,
    togglePassiveCheck,
    toggleActiveCheck,
  };
};
