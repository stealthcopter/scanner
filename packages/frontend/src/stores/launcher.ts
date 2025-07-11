import { ScanAggressivity, type ScanConfig } from "engine";
import { defineStore } from "pinia";
import { type BasicRequest, type ScanRequestPayload } from "shared";
import { reactive } from "vue";

import { useScannerService } from "@/services/scanner";
import { type FrontendSDK } from "@/types";

type FormState = {
  targets: BasicRequest[];
  config: ScanConfig;
  title: string;
};

export const useLauncher = defineStore("stores.launcher", () => {
  const scannerService = useScannerService();
  const defaultFormState: FormState = {
    targets: [],
    config: {
      aggressivity: ScanAggressivity.MEDIUM,
      inScopeOnly: true,
      scanTimeout: 10 * 60,
      checkTimeout: 2 * 60,
      concurrency: 2,
    },
    title: "Active Scan",
  };

  const form = reactive<FormState>({ ...defaultFormState });

  const toRequestPayload = (): ScanRequestPayload => ({
    requestIDs: form.targets.map((target) => target.id),
    scanConfig: form.config,
    title: form.title,
  });

  const onSubmit = async (sdk: FrontendSDK, incrementCount: () => void) => {
    const payload = toRequestPayload();
    const result = await scannerService.startActiveScan(payload);

    switch (result.kind) {
      case "Success": {
        console.log("selecting session", result.value.id);
        scannerService.selectSession(result.value.id);
        incrementCount();

        const escapeEvent = new KeyboardEvent("keydown", {
          key: "Escape",
          code: "Escape",
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(escapeEvent);
        break;
      }
      case "Error":
        break;
    }
  };

  const restart = () => {
    Object.assign(form, defaultFormState);
  };

  return {
    form,
    onSubmit,
    restart,
  };
});
