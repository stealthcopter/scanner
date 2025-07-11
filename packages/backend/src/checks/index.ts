import exposedEnvScan from "./exposed-env";
import jsonHtmlResponse from "./json-html-response";
import openRedirectScan from "./open-redirect";

export type CheckID = (typeof Checks)[keyof typeof Checks];
export const Checks = {
  EXPOSED_ENV: "exposed-env",
  JSON_HTML_RESPONSE: "json-html-response",
  OPEN_REDIRECT: "open-redirect",
} as const;

export const checks = [
  exposedEnvScan,
  jsonHtmlResponse,
  openRedirectScan,
] as const;
