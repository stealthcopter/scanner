import { type ScanRequestPayload } from "shared";

import { useSDK } from "@/plugins/sdk";

export const useScannerRepository = () => {
  const sdk = useSDK();

  const startActiveScan = async (payload: ScanRequestPayload) => {
    const response = await sdk.backend.startActiveScan(payload);
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
