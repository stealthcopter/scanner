import { type ScanType } from "engine";

export type SelectOptions = {
  /**
   * Filter by scan type (e.g. only run PASSIVE checks)
   */
  type?: ScanType;

  /**
   * A whitelist of scan IDs to run. If provided, only these scans are considered
   */
  include?: string[];

  /**
   * A blacklist of scan IDs to skip. This is applied after the 'include' and 'type' filters
   */
  exclude?: string[];
};
