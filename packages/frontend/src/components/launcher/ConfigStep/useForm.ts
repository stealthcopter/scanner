import prettyMs from "pretty-ms";
import { computed } from "vue";

import { useLauncher } from "@/stores/launcher";

export const useForm = () => {
  const { form } = useLauncher();

  const readableTimeout = computed(() => {
    const timeout = form.config.scanTimeout;
    if (!timeout || timeout <= 0) {
      return "";
    }

    return prettyMs(timeout * 1000, { verbose: true });
  });

  return {
    form,
    readableTimeout,
  };
};
