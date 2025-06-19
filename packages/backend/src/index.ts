import { type DefineAPI, type DefineEvents, type SDK } from "caido:plugin";
import { type Finding, ScanRunner, ScanStrength } from "engine";

import exposedEnvScan from "./checks/exposed-env";
import jsonHtmlResponse from "./checks/json-html-response";
import openRedirectScan from "./checks/open-redirect";
import { ScanRegistry } from "./registry";

export type API = DefineAPI<BackendEvents>;
export type BackendEvents = DefineEvents<{}>;

const scanRegistry = new ScanRegistry();

export function init(sdk: SDK<API>) {
  scanRegistry.register([exposedEnvScan, openRedirectScan, jsonHtmlResponse]);

  sdk.events.onInterceptResponse(async (sdk, request, response) => {
    const passiveScans = scanRegistry.select({});
    if (passiveScans.length === 0) {
      return;
    }

    const runner = new ScanRunner();
    passiveScans.forEach((scan) => runner.register(scan));

    const ctx = {
      request,
      response,
    };
    const findings: Finding[] = await runner.run(sdk, [ctx], {
      strength: ScanStrength.MEDIUM,
    });

    for (const finding of findings) {
      if (finding.requestID === undefined) return;

      const request = await sdk.requests.get(finding.requestID);
      if (!request) return;

      sdk.findings.create({
        reporter: "scanner-engine",
        request: request.request,
        title: finding.name,
        description: finding.description,
      });
    }
  });
}
