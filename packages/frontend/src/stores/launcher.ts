import { ScanConfig, ScanStrength } from "engine";
import { reactive } from "vue";
import { defineStore } from "pinia";
import { BasicRequest, ScanRequestPayload } from "shared";
import { FrontendSDK } from "@/types";
import { useScannerService } from "@/services/scanner";

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
      strength: ScanStrength.MEDIUM,
      inScopeOnly: true,
      scanTimeout: 10 * 60 * 1000,
      checkTimeout: 2 * 60 * 1000,
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

  const onSubmit = async (sdk: FrontendSDK) => {
    const payload = toRequestPayload();
    scannerService.startActiveScan(payload);

    // todo: thats the only way currently to close a dialog, fix once we have a better way
    const escapeEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(escapeEvent);
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
