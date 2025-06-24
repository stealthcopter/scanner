import { type UserConfigDTO } from "shared";

import { useSDK } from "@/plugins/sdk";

export const useConfigRepository = () => {
  const sdk = useSDK();

  const getConfig = async () => {
    try {
      const config = await sdk.backend.getUserConfig();
      return {
        type: "Ok" as const,
        config,
      };
    } catch {
      return {
        type: "Err" as const,
        error: "Failed to get config",
      };
    }
  };

  const updateConfig = async (update: Partial<UserConfigDTO>) => {
    try {
      await sdk.backend.updateUserConfig(update);
      return {
        type: "Ok" as const,
      };
    } catch {
      return {
        type: "Err" as const,
        error: "Failed to update config",
      };
    }
  };

  return {
    getConfig,
    updateConfig,
  };
};
