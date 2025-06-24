import { useSDK } from "@/plugins/sdk";

export const useScannerRepository = () => {
  const sdk = useSDK();

  const startActiveScan = async (requestIDs: string[]) => {
    try {
      const findings = await sdk.backend.startActiveScan(requestIDs);
      return {
        type: "Ok" as const,
        findings,
      };
    } catch {
      return {
        type: "Err" as const,
        error: "Failed to start active scan",
      };
    }
  };

  return {
    startActiveScan,
  };
};
