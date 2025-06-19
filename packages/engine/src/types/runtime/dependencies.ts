import type { JSONSerializable } from "../utils";

/**
 * Utilities to interact with dependencies.
 * Dependency is a check that has been executed before and its result is stored.
 */
export type DependenciesSDK = {
  /**
   * Get the dependency result.
   * @returns Result of the dependency.
   */
  get: (scanId: string) => JSONSerializable | undefined;
};
