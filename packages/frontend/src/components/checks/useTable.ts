import type { CheckMetadata } from "engine";
import type { DataTableFilterMeta } from "primevue/datatable";
import { computed, ref } from "vue";

import { useChecksService } from "@/services/checks";
import { useConfigService } from "@/services/config";

export const useTable = () => {
  const search = ref("");
  const typeFilter = ref("all");
  const expandedRows = ref([]);

  const typeOptions = [
    { label: "All Checks", value: "all" },
    { label: "Passive", value: "passive" },
    { label: "Active", value: "active" },
  ];

  const checksService = useChecksService();
  const configService = useConfigService();

  const filters = computed<DataTableFilterMeta>(() => ({
    global: { value: search.value ?? "", matchMode: "contains" },
  }));

  const checks = computed(() => {
    const checksState = checksService.getState();
    if (checksState.type !== "Success") return [];

    return checksState.checks.filter((check) => {
      const typeMatches = filterByType(check.type, typeFilter.value ?? "all");
      return typeMatches;
    });
  });

  const getAggressivityText = (check: CheckMetadata) => {
    const { minRequests, maxRequests } = check.aggressivity;
    if (minRequests === maxRequests) {
      return `${minRequests} request${minRequests === 1 ? "" : "s"}`;
    }
    return `${minRequests}-${
      maxRequests === "Infinity" ? "Infinite" : maxRequests
    } requests`;
  };

  const filterByType = (value: string, filter: string) => {
    if (!filter || filter === "all") return true;
    return value === filter;
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
    typeFilter,
    expandedRows,
    typeOptions,
    filters,
    checks,
    getPassiveEnabled,
    getActiveEnabled,
    getAggressivityText,
    togglePassiveCheck,
    toggleActiveCheck,
  };
};
