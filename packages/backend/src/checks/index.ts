import antiClickjackingScan from "./anti-clickjacking";
import applicationErrorsScan from "./application-errors";
import bigRedirectsScan from "./big-redirects";
import corsMisconfigScan from "./cors-misconfig";
import cspAnalysisScan from "./csp-analysis";
import debugErrorsScan from "./debug-errors";
import exposedEnvScan from "./exposed-env";
import gitConfigScan from "./git-config";
import hashDisclosureScan from "./hash-disclosure";
import hstsScan from "./hsts";
import jsonHtmlResponseScan from "./json-html-response";
import openRedirectScan from "./open-redirect";
import pathTraversalScan from "./path-traversal";
import phpinfoScan from "./phpinfo";
import { basicReflectedXSSScan } from "./reflected-xss";
import { mysqlErrorBased } from "./sql-injection";

export type CheckID = (typeof Checks)[keyof typeof Checks];
export const Checks = {
  ANTI_CLICKJACKING: "anti-clickjacking",
  APPLICATION_ERRORS: "application-errors",
  BIG_REDIRECTS: "big-redirects",
  CORS_MISCONFIG: "cors-misconfig",
  CSP_ANALYSIS: "csp-analysis",
  DEBUG_ERRORS: "debug-errors",
  EXPOSED_ENV: "exposed-env",
  GIT_CONFIG: "git-config",
  HASH_DISCLOSURE: "hash-disclosure",
  HSTS: "hsts",
  JSON_HTML_RESPONSE: "json-html-response",
  OPEN_REDIRECT: "open-redirect",
  PATH_TRAVERSAL: "path-traversal",
  PHPINFO: "phpinfo",
  BASIC_REFLECTED_XSS: "basic-reflected-xss",
  MYSQL_ERROR_BASED_SQLI: "mysql-error-based-sqli",
  // MYSQL_TIME_BASED_SQLI: "mysql-time-based-sqli" - TODO: fix false positives
} as const;

export const checks = [
  antiClickjackingScan,
  applicationErrorsScan,
  bigRedirectsScan,
  corsMisconfigScan,
  cspAnalysisScan,
  debugErrorsScan,
  exposedEnvScan,
  gitConfigScan,
  hashDisclosureScan,
  hstsScan,
  jsonHtmlResponseScan,
  openRedirectScan,
  pathTraversalScan,
  phpinfoScan,
  basicReflectedXSSScan,
  mysqlErrorBased,
  // mysqlTimeBased,
] as const;
