import { useSDK } from "@/plugins/sdk";

export const useScannerRepository = () => {
  const sdk = useSDK();

  const startActiveScan = async (requestIDs: string[]) => {
    const response = await sdk.backend.startActiveScan(requestIDs);
    return response;
  };

  const getScanSession = async (sessionId: string) => {
    const response = await sdk.backend.getScanSession(sessionId);
    return response;
  };

  const getScanSessions = async () => {
    const response = await sdk.backend.getScanSessions();
    return response;
  };

  return {
    startActiveScan,
    getScanSession,
    getScanSessions,
  };
};
