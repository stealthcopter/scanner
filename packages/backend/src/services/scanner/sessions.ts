import { error, ok, type Result, type Session } from "shared";

import { ScannerStore } from "../../stores/scanner";
import { type BackendSDK } from "../../types";

export const getScanSession = (_: BackendSDK, id: string): Result<Session> => {
  const session = ScannerStore.get().getSession(id);
  if (!session) {
    return error(`Session ${id} not found`);
  }

  return ok(session);
};

export const getScanSessions = (_: BackendSDK): Result<Session[]> => {
  const sessions = ScannerStore.get().listSessions();
  return ok(sessions);
};

export const cancelScanSession = async (
  _: BackendSDK,
  id: string,
): Promise<Result<boolean>> => {
  const store = ScannerStore.get();
  const result = await store.cancelRunnable(id);
  return ok(result);
};

export const deleteScanSession = (
  _: BackendSDK,
  id: string,
): Result<boolean> => {
  const result = ScannerStore.get().deleteSession(id);
  return ok(result);
};

export const updateSessionTitle = (
  sdk: BackendSDK,
  id: string,
  title: string,
): Result<Session> => {
  const result = ScannerStore.get().updateSessionTitle(id, title);
  if (!result) {
    return error(`Session ${id} not found`);
  }

  if (result.title.trim().length === 0) {
    return error("Title is required");
  }

  if (result.title.length > 100) {
    return error("Title is too long");
  }

  sdk.api.send("session:updated", id, result);
  return ok(result);
};
