import { type DefineAPI, type SDK } from "caido:plugin";
import { ScanRunner } from "engine";

import openRedirectScan from "./checks/open-redirect";
import { ScanRegistry } from "./registry";

export type API = DefineAPI<{}>;

const scanRegistry = new ScanRegistry();

export function init(sdk: SDK<API>) {
  scanRegistry.register([openRedirectScan]);

  sdk.events.onInterceptResponse(async (sdk, request, response) => {
    const passiveScans = scanRegistry.select({ type: "passive" });
    if (passiveScans.length === 0) {
      return;
    }

    const runner = new ScanRunner();
    passiveScans.forEach((scan) => runner.register(scan));

    const findings = await runner.runSingle(
      {
        request,
        response,
      },
      sdk,
    );

    for (const finding of findings) {
      if (!finding.requestID) return;

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
