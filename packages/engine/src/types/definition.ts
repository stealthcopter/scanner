import type { ScanContext, ScanStrength, ScanTarget } from "./runner";
import type { ScanTask } from "./task";

export type Aggressivity = {
  minRequests: number;
  maxRequests: number | "Infinity";
};

export type ScanType = "passive" | "active";

export type ScanMetadata = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  aggressivity: Aggressivity;
  type: ScanType;
  dependsOn?: string[];
  minStrength?: ScanStrength;
};

export type ScanDefinition = {
  metadata: ScanMetadata;
  dedupeKey?: (context: ScanTarget) => string;
  when?: (context: ScanContext) => boolean;
  create: (context: ScanContext) => ScanTask;
};
