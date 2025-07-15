import corsMisconfigScan from "./cors-misconfig";
import exposedEnvScan from "./exposed-env";
import gitConfigScan from "./git-config";
import jsonHtmlResponse from "./json-html-response";
import openRedirectScan from "./open-redirect";

export type CheckID = (typeof Checks)[keyof typeof Checks];
export const Checks = {
  CORS_MISCONFIG: "cors-misconfig",
  EXPOSED_ENV: "exposed-env",
  GIT_CONFIG: "git-config",
  JSON_HTML_RESPONSE: "json-html-response",
  OPEN_REDIRECT: "open-redirect",
} as const;

export const checks = [
  corsMisconfigScan,
  exposedEnvScan,
  gitConfigScan,
  jsonHtmlResponse,
  openRedirectScan,
] as const;
