import { defineStore } from "pinia";
import { type DeepPartial, type UserConfig } from "shared";
import { merge } from "ts-deepmerge";

import { useConfigRepository } from "@/repositories/config";
import { useConfigStore } from "@/stores/config";

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

  const updateConfig = async (update: DeepPartial<UserConfig>) => {
    const currState = store.getState();
    if (currState.type === "Success") {
      const updatedConfig = merge.withOptions(
        { mergeArrays: false },
        currState.config,
        update,
      ) as UserConfig;
      const result = await repository.updateConfig(updatedConfig);
      if (result.kind === "Success") {
        store.send({ type: "UpdateConfig", config: updatedConfig });
      } else {
        store.send({ type: "Error", error: result.error });
      }
    }
  };

  return {
    getState,
    initialize,
    updateConfig,
  };
});
