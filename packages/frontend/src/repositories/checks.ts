import { type GetChecksOptions } from "shared";

import { useSDK } from "@/plugins/sdk";

export const useChecksRepository = () => {
  const sdk = useSDK();

  const getChecks = async (options: GetChecksOptions = {}) => {
    const checks = await sdk.backend.getChecks(options);
    return checks;
  };

  return {
    getChecks,
  };
};
