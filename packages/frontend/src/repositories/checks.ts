import { type GetChecksOptions } from "shared";

import { useSDK } from "@/plugins/sdk";

export const useChecksRepository = () => {
  const sdk = useSDK();

  const getChecks = async (options?: GetChecksOptions) => {
    try {
      const checks = await sdk.backend.getChecks(options);
      return {
        type: "Ok" as const,
        checks,
      };
    } catch {
      return {
        type: "Err" as const,
        error: "Failed to get checks",
      };
    }
  };

  return {
    getChecks,
  };
};
