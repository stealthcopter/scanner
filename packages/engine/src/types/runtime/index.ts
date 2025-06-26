import type { ScanDependencies } from "./dependencies";
import type { HTMLParser } from "./html";

export type ScanRuntime = {
  dependencies: ScanDependencies;
  html: HTMLParser;
};
