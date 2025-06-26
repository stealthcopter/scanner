import { defineStore } from "pinia";

import { useConfigRepository } from "@/repositories/config";
import { useConfigStore } from "@/stores/config";
import { UserConfig } from "shared";

export const useConfigService = defineStore("services.config", () => {
  const repository = useConfigRepository();
  const store = useConfigStore();

  const getState = () => store.getState();

  const initialize = async () => {
    store.send({ type: "Start" });

    const result = await repository.getConfig();

    if (result.kind === "Success") {
      store.send({ type: "Success", config: result.value });
    } else {
      store.send({ type: "Error", error: result.error });
    }
  };

  const updateConfig = async (update: Partial<UserConfig>) => {
    const result = await repository.updateConfig(update);
    if (result.kind === "Success") {
      store.send({ type: "UpdateConfig", config: update });
    } else {
      store.send({ type: "Error", error: result.error });
    }
  };

  return {
    getState,
    initialize,
    updateConfig,
  };
});
