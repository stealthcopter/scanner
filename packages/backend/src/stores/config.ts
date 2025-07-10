import { ScanStrength } from "engine";
import { type UserConfig } from "shared";

export class ConfigStore {
  private static _store?: ConfigStore;

  private config: UserConfig;

  private constructor() {
    this.config = {
      passive: {
        enabled: true,
        strength: ScanStrength.HIGH,
        inScopeOnly: false,
        scansConcurrency: 3,
        overrides: [],
      },
      active: {
        overrides: [],
      },
      // TODO: improve presets
      presets: [
        {
          name: "Light",
          active: [
            {
              checkID: "exposed-env",
              enabled: true,
            },
            {
              checkID: "json-html-response",
              enabled: true,
            },
            {
              checkID: "open-redirect",
              enabled: false,
            },
          ],
          passive: [
            {
              checkID: "exposed-env",
              enabled: false,
            },
            {
              checkID: "json-html-response",
              enabled: true,
            },
            {
              checkID: "open-redirect",
              enabled: false,
            },
          ],
        },
        {
          name: "Balanced",
          active: [
            {
              checkID: "exposed-env",
              enabled: true,
            },
            {
              checkID: "json-html-response",
              enabled: true,
            },
            {
              checkID: "open-redirect",
              enabled: true,
            },
          ],
          passive: [
            {
              checkID: "exposed-env",
              enabled: true,
            },
            {
              checkID: "json-html-response",
              enabled: true,
            },
            {
              checkID: "open-redirect",
              enabled: false,
            },
          ],
        },
        {
          name: "Heavy",
          active: [
            {
              checkID: "exposed-env",
              enabled: true,
            },
            {
              checkID: "json-html-response",
              enabled: true,
            },
            {
              checkID: "open-redirect",
              enabled: true,
            },
          ],
          passive: [
            {
              checkID: "exposed-env",
              enabled: true,
            },
            {
              checkID: "json-html-response",
              enabled: true,
            },
            {
              checkID: "open-redirect",
              enabled: true,
            },
          ],
        },
      ],
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

  updateUserConfig(config: Partial<UserConfig>) {
    Object.assign(this.config, config);
    return this.config;
  }
}
