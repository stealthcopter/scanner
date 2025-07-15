import { error, ok, type Result, type Session } from "shared";

import { IdSchema, SessionTitleSchema } from "../../schemas";
import { ScannerStore } from "../../stores/scanner";
import { type BackendSDK } from "../../types";
import { validateInput } from "../../utils/validation";

export const getScanSession = (_: BackendSDK, id: string): Result<Session> => {
  const validation = validateInput(IdSchema, id);
  if (validation.kind === "Error") {
    return validation;
  }

  const session = ScannerStore.get().getSession(validation.value);
  if (!session) {
    return error(`Session ${validation.value} not found`);
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
  const validation = validateInput(IdSchema, id);
  if (validation.kind === "Error") {
    return validation;
  }

  const store = ScannerStore.get();
  const result = await store.cancelRunnable(validation.value);
  return ok(result);
};

export const deleteScanSession = (
  _: BackendSDK,
  id: string,
): Result<boolean> => {
  const validation = validateInput(IdSchema, id);
  if (validation.kind === "Error") {
    return validation;
  }

  const result = ScannerStore.get().deleteSession(validation.value);
  return ok(result);
};

export const updateSessionTitle = (
  sdk: BackendSDK,
  id: string,
  title: string,
): Result<Session> => {
  const idValidation = validateInput(IdSchema, id);
  if (idValidation.kind === "Error") {
    return idValidation;
  }

  const titleValidation = validateInput(SessionTitleSchema, title);
  if (titleValidation.kind === "Error") {
    return titleValidation;
  }

  const result = ScannerStore.get().updateSessionTitle(idValidation.value, titleValidation.value);
  if (!result) {
    return error(`Session ${idValidation.value} not found`);
  }

  sdk.api.send("session:updated", idValidation.value, result);
  return ok(result);
};
