import { Classic } from "@caido/primevue";
import PrimeVue from "primevue/config";
import { createApp } from "vue";

import { SDKPlugin } from "./plugins/sdk";
import "./styles/index.css";
import type { FrontendSDK } from "./types";
import App from "./views/App.vue";

export const init = (sdk: FrontendSDK) => {
  const app = createApp(App);

  app.use(PrimeVue, {
    unstyled: true,
    pt: Classic,
  });

  app.use(SDKPlugin, sdk);

  const root = document.createElement("div");
  Object.assign(root.style, {
    height: "100%",
    width: "100%",
  });

  root.id = `plugin--scanner`;

  app.mount(root);

  sdk.navigation.addPage("/scanner", {
    body: root,
  });

  sdk.sidebar.registerItem("Scanner", "/scanner", {
    icon: "fas fa-shield-alt",
  });

  sdk.commands.register("run-active-scanner", {
    name: "Run Active Scanner",
    run: async (context) => {
      let requestIds: string[] = [];

      if (context.type === "RequestRowContext") {
        requestIds = context.requests.map((req) => req.id.toString());
      } else if (context.type === "RequestContext" && context.request.id) {
        requestIds = [context.request.id.toString()];
      }

      if (requestIds.length === 0) {
        sdk.window.showToast("No requests selected", { variant: "warning" });
        return;
      }

      const result = await sdk.backend.startActiveScan(requestIds);
      if (result.kind === "Error") {
        sdk.window.showToast(`Scan failed: ${result.error}`, {
          variant: "error",
        });
        return;
      }

      for (const finding of result.value) {
        if (finding.requestID === undefined) continue;

        await sdk.findings.createFinding(finding.requestID, {
          reporter: "Scanner: Active",
          title: finding.name,
          description: finding.description,
        });
      }

      if (result.value.length > 0) {
        sdk.window.showToast(
          `Created ${result.value.length} finding${result.value.length === 1 ? "" : "s"}`,
          { variant: "success" },
        );
      } else {
        sdk.window.showToast("No findings detected", { variant: "info" });
      }
    },
    group: "Scanner",
    when: (context) => {
      return (
        context.type === "RequestRowContext" ||
        (context.type === "RequestContext" && context.request.id !== undefined)
      );
    },
  });

  sdk.menu.registerItem({
    type: "RequestRow",
    commandId: "run-active-scanner",
    leadingIcon: "fas fa-shield-alt",
  });
};
