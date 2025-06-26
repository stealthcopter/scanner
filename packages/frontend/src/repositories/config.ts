import { type UserConfig } from "shared";

import { useSDK } from "@/plugins/sdk";

export const useConfigRepository = () => {
  const sdk = useSDK();

  const getConfig = async () => {
    const config = await sdk.backend.getUserConfig();
    return config;
  };

  const updateConfig = async (update: Partial<UserConfig>) => {
    const response = await sdk.backend.updateUserConfig(update);
    return response;
  };

  return {
    getConfig,
    updateConfig,
  };
};
