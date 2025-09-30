import antiClickjackingScan from "./anti-clickjacking";
import applicationErrorsScan from "./application-errors";
import bigRedirectsScan from "./big-redirects";
import commandInjectionScan from "./command-injection";
import cookieHttpOnlyScan from "./cookie-httponly";
import cookieSecureScan from "./cookie-secure";
import corsMisconfigScan from "./cors-misconfig";
import creditCardDisclosureScan from "./credit-card-disclosure";
import dbConnectionDisclosureScan from "./db-connection-disclosure";
import debugErrorsScan from "./debug-errors";
import directoryListingScan from "./directory-listing";
import emailDisclosureScan from "./email-disclosure";
import exposedEnvScan from "./exposed-env";
import gitConfigScan from "./git-config";
import hashDisclosureScan from "./hash-disclosure";
import jsonHtmlResponseScan from "./json-html-response";
import openRedirectScan from "./open-redirect";
import pathTraversalScan from "./path-traversal";
import phpinfoScan from "./phpinfo";
import privateIpDisclosureScan from "./private-ip-disclosure";
import privateKeyDisclosureScan from "./private-key-disclosure";
import { basicReflectedXSSScan } from "./reflected-xss";
import robotsTxtScan from "./robots-txt";
import { mysqlErrorBased } from "./sql-injection";
import sqlStatementInParams from "./sql-statement-in-params";
import ssnDisclosureScan from "./ssn-disclosure";
import sstiScan from "./ssti";

export type CheckID = (typeof Checks)[keyof typeof Checks];
export const Checks = {
  ANTI_CLICKJACKING: "anti-clickjacking",
  APPLICATION_ERRORS: "application-errors",
  BIG_REDIRECTS: "big-redirects",
  COMMAND_INJECTION: "command-injection",
  COOKIE_HTTPONLY: "cookie-httponly",
  COOKIE_SECURE: "cookie-secure",
  CORS_MISCONFIG: "cors-misconfig",
  CREDIT_CARD_DISCLOSURE: "credit-card-disclosure",
  DB_CONNECTION_DISCLOSURE: "db-connection-disclosure",
  DEBUG_ERRORS: "debug-errors",
  DIRECTORY_LISTING: "directory-listing",
  EMAIL_DISCLOSURE: "email-disclosure",
  EXPOSED_ENV: "exposed-env",
  GIT_CONFIG: "git-config",
  HASH_DISCLOSURE: "hash-disclosure",
  JSON_HTML_RESPONSE: "json-html-response",
  OPEN_REDIRECT: "open-redirect",
  PATH_TRAVERSAL: "path-traversal",
  PHPINFO: "phpinfo",
  PRIVATE_IP_DISCLOSURE: "private-ip-disclosure",
  PRIVATE_KEY_DISCLOSURE: "private-key-disclosure",
  ROBOTS_TXT: "robots-txt",
  BASIC_REFLECTED_XSS: "basic-reflected-xss",
  MYSQL_ERROR_BASED_SQLI: "mysql-error-based-sqli",
  SSTI: "ssti",
  SQL_STATEMENT_IN_PARAMS: "sql-statement-in-params",
  SSN_DISCLOSURE: "ssn-disclosure",
  // MYSQL_TIME_BASED_SQLI: "mysql-time-based-sqli" - TODO: fix false positives
} as const;

export const checks = [
  antiClickjackingScan,
  applicationErrorsScan,
  bigRedirectsScan,
  commandInjectionScan,
  cookieHttpOnlyScan,
  cookieSecureScan,
  corsMisconfigScan,
  creditCardDisclosureScan,
  dbConnectionDisclosureScan,
  debugErrorsScan,
  directoryListingScan,
  emailDisclosureScan,
  exposedEnvScan,
  gitConfigScan,
  hashDisclosureScan,
  jsonHtmlResponseScan,
  openRedirectScan,
  pathTraversalScan,
  phpinfoScan,
  privateIpDisclosureScan,
  privateKeyDisclosureScan,
  robotsTxtScan,
  basicReflectedXSSScan,
  mysqlErrorBased,
  sstiScan,
  sqlStatementInParams,
  ssnDisclosureScan,
  // mysqlTimeBased,
] as const;
