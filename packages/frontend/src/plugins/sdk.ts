import { getCurrentInstance, inject, provide, type Plugin } from "vue";
import type { FrontendSDK } from "@/types";

export const KEY = "sdk";

export const SDKPlugin: Plugin = (app, sdk: FrontendSDK) => {
  app.provide(KEY, sdk);
};

export const useSDK = () => {
  return inject(KEY) as FrontendSDK;
};

export const provideSDK = (sdk: FrontendSDK) => {
  const app = getCurrentInstance()?.appContext.app;
  if (app) {
    app.provide(KEY, sdk);
  } else {
    provide(KEY, sdk);
  }
};
