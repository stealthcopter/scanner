import { type DefineAPI, type SDK } from "caido:plugin";
import { ScanRunner } from "engine";

import { openRedirectScan } from "./checks/open-redirect";

export type API = DefineAPI<{}>;

export function init(sdk: SDK<API>) {
  const runner = new ScanRunner();
  runner.register(openRedirectScan);

  sdk.events.onInterceptResponse(async (sdk, request, response) => {
    const result = await runner.run({
      request,
      response,
      sdk,
    });

    result.forEach(async (finding) => {
      if (!finding.requestID) return;

      const request = await sdk.requests.get(finding.requestID);
      if (!request) return;

      sdk.findings.create({
        reporter: "scanner-engine",
        request: request.request,
        title: finding.name,
        description: finding.description,
      });
    });
  });
}
