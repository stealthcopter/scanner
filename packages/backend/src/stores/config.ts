import { ScanStrength } from "engine";
import { type UserConfigDTO } from "shared";

export class ConfigStore {
  private static _store?: ConfigStore;

  private config: UserConfigDTO;

  private constructor() {
    this.config = {
      passive: {
        enabled: false,
        strength: ScanStrength.MEDIUM,
        overrides: {},
      },
    };
  }

  static get(): ConfigStore {
    if (!ConfigStore._store) {
      ConfigStore._store = new ConfigStore();
    }

    return ConfigStore._store;
  }

  getUserConfig() {
    return { ...this.config };
  }

  updateUserConfig(config: Partial<UserConfigDTO>) {
    Object.assign(this.config, config);
    return this.config;
  }
}
