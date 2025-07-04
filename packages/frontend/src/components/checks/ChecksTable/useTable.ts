import type { CheckMetadata } from "engine";
import type { DataTableFilterMeta } from "primevue/datatable";
import { computed, type Ref } from "vue";

import { useConfigService } from "@/services/config";

export const useTable = (options: {
  search?: Ref<string>;
  typeFilter?: Ref<string>;
}) => {
  const { search, typeFilter } = options;
  const configService = useConfigService();

  const filters = computed<DataTableFilterMeta>(() => ({
    global: { value: search?.value ?? "", matchMode: "contains" },
  }));

  const getFilteredChecks = (checks: CheckMetadata[]) => {
    return checks.filter((check) => {
      const typeMatches = filterByType(check.type, typeFilter?.value ?? "all");
      return typeMatches;
    });
  };

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
    filters,
    getFilteredChecks,
    filterByType,
    getPassiveEnabled,
    getActiveEnabled,
    getAggressivityText,
    togglePassiveCheck,
    toggleActiveCheck,
  };
};
