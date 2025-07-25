import { ok, type Result, type UserConfig } from "shared";

import { ConfigStore } from "../stores/config";
import { type BackendSDK } from "../types";

export const getUserConfig = (_: BackendSDK): Result<UserConfig> => {
  const store = ConfigStore.get();
  return ok(store.getUserConfig());
};

export const updateUserConfig = (
  _: BackendSDK,
  config: Partial<UserConfig>,
): Result<void> => {
  const store = ConfigStore.get();
  store.updateUserConfig(config);
  return ok(undefined);
};
