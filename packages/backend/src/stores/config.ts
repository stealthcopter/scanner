import { ScanAggressivity } from "engine";
import { Checks } from "../checks";
import { type UserConfig } from "shared";

export class ConfigStore {
  private static _store?: ConfigStore;

  private config: UserConfig;

  private constructor() {
    this.config = {
      passive: {
        enabled: true,
        aggressivity: ScanAggressivity.HIGH,
        inScopeOnly: false,
        scansConcurrency: 3,
        overrides: [],
      },
      active: {
        overrides: [],
      },
      // TODO: improve default presets
      presets: [
        {
          name: "Light",
          active: [
            {
              checkID: Checks.EXPOSED_ENV,
              enabled: true,
            },
            {
              checkID: Checks.JSON_HTML_RESPONSE,
              enabled: true,
            },
            {
              checkID: Checks.OPEN_REDIRECT,
              enabled: false,
            },
          ],
          passive: [
            {
              checkID: Checks.EXPOSED_ENV,
              enabled: false,
            },
            {
              checkID: Checks.JSON_HTML_RESPONSE,
              enabled: true,
            },
            {
              checkID: Checks.OPEN_REDIRECT,
              enabled: false,
            },
          ],
        },
        {
          name: "Balanced",
          active: [
            {
              checkID: Checks.EXPOSED_ENV,
              enabled: true,
            },
            {
              checkID: Checks.JSON_HTML_RESPONSE,
              enabled: true,
            },
            {
              checkID: Checks.OPEN_REDIRECT,
              enabled: true,
            },
          ],
          passive: [
            {
              checkID: Checks.EXPOSED_ENV,
              enabled: true,
            },
            {
              checkID: Checks.JSON_HTML_RESPONSE,
              enabled: true,
            },
            {
              checkID: Checks.OPEN_REDIRECT,
              enabled: false,
            },
          ],
        },
        {
          name: "Heavy",
          active: [
            {
              checkID: Checks.EXPOSED_ENV,
              enabled: true,
            },
            {
              checkID: Checks.JSON_HTML_RESPONSE,
              enabled: true,
            },
            {
              checkID: Checks.OPEN_REDIRECT,
              enabled: true,
            },
          ],
          passive: [
            {
              checkID: Checks.EXPOSED_ENV,
              enabled: true,
            },
            {
              checkID: Checks.JSON_HTML_RESPONSE,
              enabled: true,
            },
            {
              checkID: Checks.OPEN_REDIRECT,
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
