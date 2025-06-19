import type { DependenciesSDK } from "./dependencies";
import type { HtmlSDK } from "./html";

export type RuntimeSDK = {
  dependencies: DependenciesSDK;
  html: HtmlSDK;
};
