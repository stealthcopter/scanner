import { Classic } from "@caido/primevue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import { createApp, defineComponent, h } from "vue";

import { SDKPlugin } from "./plugins/sdk";
import "./styles/index.css";
import type { FrontendSDK } from "./types";
import App from "./views/App.vue";

import { ScanLauncher } from "@/components/launcher";
import { useLauncher } from "@/stores/launcher";

export const init = (sdk: FrontendSDK) => {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);

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

  let sidebarCount = 0;
  sdk.navigation.addPage("/scanner", {
    body: root,
    onEnter: () => {
      sidebarCount = 0;
      sidebarItem.setCount(sidebarCount);
    },
  });

  const sidebarItem = sdk.sidebar.registerItem("Scanner", "/scanner", {
    icon: "fas fa-shield-alt",
  });

  const incrementCount = () => {
    sidebarCount++;
    sidebarItem.setCount(sidebarCount);
  };

  sdk.commands.register("run-active-scanner", {
    name: "Run Active Scanner",
    run: (context) => {
      let requests = [];

      if (context.type === "RequestRowContext") {
        context.requests.forEach((request) => {
          requests.push({
            id: request.id.toString(),
            host: request.host,
            port: request.port,
            path: request.path,
            query: request.query,
          });
        });
      } else if (context.type === "RequestContext" && context.request.id) {
        requests.push({
          id: context.request.id.toString(),
          host: context.request.host,
          port: context.request.port,
          path: context.request.path,
          query: context.request.query,
        });
      } else {
        sdk.window.showToast("No requests selected", { variant: "warning" });
        return;
      }

      requests = requests.filter(
        (request, index, self) =>
          index ===
          self.findIndex(
            (t) =>
              t.host === request.host &&
              t.port === request.port &&
              t.path === request.path &&
              t.query === request.query,
          ),
      );

      if (requests.length === 0) {
        sdk.window.showToast("No requests selected", { variant: "warning" });
        return;
      }

      const launcherStore = useLauncher();
      launcherStore.restart();
      launcherStore.form.targets = requests.map((request) => ({
        ...request,
        method: "GET",
      }));

      sdk.window.showDialog(
        {
          type: "Custom",
          component: defineComponent((props) => {
            return () => h(ScanLauncher, { ...props, sdk, incrementCount });
          }),
        },
        {
          title: "Scan Launcher",
          draggable: false,
          closeOnEscape: true,
          modal: true,
          position: "center",
        },
      );
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

  sdk.navigation.goTo("/scanner")
};
