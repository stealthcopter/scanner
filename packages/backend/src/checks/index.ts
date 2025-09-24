import antiClickjackingScan from "./anti-clickjacking";
import applicationErrorsScan from "./application-errors";
import bigRedirectsScan from "./big-redirects";
import commandInjectionScan from "./command-injection";
import corsMisconfigScan from "./cors-misconfig";
import debugErrorsScan from "./debug-errors";
import directoryListingScan from "./directory-listing";
import exposedEnvScan from "./exposed-env";
import gitConfigScan from "./git-config";
import hashDisclosureScan from "./hash-disclosure";
import jsonHtmlResponseScan from "./json-html-response";
import openRedirectScan from "./open-redirect";
import pathTraversalScan from "./path-traversal";
import phpinfoScan from "./phpinfo";
import { basicReflectedXSSScan } from "./reflected-xss";
import robotsTxtScan from "./robots-txt";
import { mysqlErrorBased } from "./sql-injection";
import sstiScan from "./ssti";

export type CheckID = (typeof Checks)[keyof typeof Checks];
export const Checks = {
  ANTI_CLICKJACKING: "anti-clickjacking",
  APPLICATION_ERRORS: "application-errors",
  BIG_REDIRECTS: "big-redirects",
  COMMAND_INJECTION: "command-injection",
  CORS_MISCONFIG: "cors-misconfig",
  DEBUG_ERRORS: "debug-errors",
  EXPOSED_ENV: "exposed-env",
  GIT_CONFIG: "git-config",
  HASH_DISCLOSURE: "hash-disclosure",
  JSON_HTML_RESPONSE: "json-html-response",
  OPEN_REDIRECT: "open-redirect",
  PATH_TRAVERSAL: "path-traversal",
  PHPINFO: "phpinfo",
  ROBOTS_TXT: "robots-txt",
  BASIC_REFLECTED_XSS: "basic-reflected-xss",
  MYSQL_ERROR_BASED_SQLI: "mysql-error-based-sqli",
  SSTI: "ssti",
  DIRECTORY_LISTING: "directory-listing",
  // MYSQL_TIME_BASED_SQLI: "mysql-time-based-sqli" - TODO: fix false positives
} as const;

export const checks = [
  antiClickjackingScan,
  applicationErrorsScan,
  bigRedirectsScan,
  commandInjectionScan,
  corsMisconfigScan,
  debugErrorsScan,
  exposedEnvScan,
  gitConfigScan,
  hashDisclosureScan,
  jsonHtmlResponseScan,
  openRedirectScan,
  pathTraversalScan,
  phpinfoScan,
  robotsTxtScan,
  basicReflectedXSSScan,
  mysqlErrorBased,
  sstiScan,
  directoryListingScan,
  // mysqlTimeBased,
] as const;
