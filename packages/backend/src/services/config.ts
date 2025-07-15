import { ok, type Result, type UserConfig } from "shared";

import { PartialUserConfigSchema } from "../schemas";
import { ConfigStore } from "../stores/config";
import { type BackendSDK } from "../types";
import { validateInput } from "../utils/validation";

export const getUserConfig = (_: BackendSDK): Result<UserConfig> => {
  const store = ConfigStore.get();
  return ok(store.getUserConfig());
};

export const updateUserConfig = (
  _: BackendSDK,
  config: Partial<UserConfig>,
): Result<void> => {
  const validation = validateInput(PartialUserConfigSchema, config);
  if (validation.kind === "Error") {
    return validation;
  }

  const store = ConfigStore.get();
  store.updateUserConfig(validation.value as Partial<UserConfig>);
  return ok(undefined);
};
