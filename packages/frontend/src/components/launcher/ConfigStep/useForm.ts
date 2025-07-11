import { ScanAggressivity } from "engine";
import prettyMs from "pretty-ms";
import { computed, ref } from "vue";

import { useLauncher } from "@/stores/launcher";

export const useForm = () => {
  const { form } = useLauncher();

  const aggressivityOptions = ref([
    { label: "Low", value: ScanAggressivity.LOW },
    { label: "Medium", value: ScanAggressivity.MEDIUM },
    { label: "High", value: ScanAggressivity.HIGH },
  ]);

  const readableTimeout = computed(() => {
    const timeout = form.config.scanTimeout;
    if (!timeout || timeout <= 0) {
      return "";
    }

    return prettyMs(timeout * 1000, { verbose: true });
  });

  return {
    form,
    aggressivityOptions,
    readableTimeout,
  };
};
