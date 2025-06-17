import {
  type CheckContext,
  type RequestContext,
  type ScanStrength,
} from "./context";
import { type ScanTask, type StepAction, type StepName } from "./execution";

export type Agressivity = {
  minRequests: number;
  maxRequests: number | "Infinity";
};

export type ScanType = "passive" | "active";

export type ScanMetadata = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  aggressivity: Agressivity;
  type: ScanType;
  dependsOn?: string[];
  minStrength?: ScanStrength;
};

export type ScanDefinition = {
  metadata: ScanMetadata;
  dedupeKey?: (context: RequestContext) => string;
  when: (context: CheckContext) => boolean;
  create: (ctx: CheckContext) => ScanTask;
};

export type DefineUtils<T> = {
  step: (name: StepName, action: StepAction<T>) => void;
};
