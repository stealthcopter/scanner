import { type Finding, type Severity } from "./finding";
import {
  type RuntimeContext,
  type ScanAggressivity,
  type ScanTarget,
} from "./runner";
import { type JSONSerializable } from "./utils";

export type CheckAggressivity = {
  minRequests: number;
  maxRequests: number | "Infinity";
};

export type CheckType = "passive" | "active";
export type CheckMetadata = {
  /** Unique identifier for the check */
  id: string;
  /** Human-readable name displayed in the UI */
  name: string;
  /** Detailed description of what the check does and what vulnerabilities it detects */
  description: string;
  /** Array of tags used for categorization and filtering */
  tags: string[];
  /** Defines the request limits for this check. Please use Infinity if it's dynamic. */
  aggressivity: CheckAggressivity;
  /** Whether this is a passive or active check */
  type: CheckType;
  /**
   * Array of possible severity levels this check can report.
   * This is used for filtering.
   * Engine will throw an error if you return a finding with a severity that is not in this array.
   **/
  severities: Severity[];
  /** Optional: Array of check IDs that must run before this check */
  dependsOn?: string[];
  /** Optional: Minimum scan aggressivity level required for this check to run */
  minAggressivity?: ScanAggressivity;
  /** Optional: array of check IDs - if any of these check IDs have found any findings during the scan, skip this check */
  skipIfFoundBy?: string[];
};

type CheckBase = {
  /** Metadata for the check. This contains all the information about the check. */
  metadata: CheckMetadata;
  /** Optional: Function that returns a unique key for the target. This is used to deduplicate findings. */
  dedupeKey?: (target: ScanTarget) => string;
  /** Optional: Function that returns a boolean indicating whether the check should run for the target. You can check here for example if the target method is POST. */
  when?: (target: ScanTarget) => boolean;
};

export type CheckSpec<T> = CheckBase & {
  /** Optional: Function that returns the initial state for the check. */
  initState?: () => T;
  /** Optional: Function that returns the output for the check. This is the data you return to dependencies. */
  output?: ({
    state,
    context,
  }: {
    state: T;
    context: RuntimeContext;
  }) => CheckOutput;
};

export type Check = CheckBase & {
  create: (context: RuntimeContext) => CheckTask;
};

export type CheckBuilder<T> = {
  step: (name: StepName, action: StepAction<T>) => void;
};

export type StepName = string;

export type StepResult<T> =
  | {
      kind: "Done";
      findings?: Finding[];
      state?: T;
    }
  | {
      kind: "Continue";
      nextStep: StepName;
      state: T;
      findings?: Finding[];
    };

export type StepAction<T> = (
  state: T,
  context: RuntimeContext,
) => Promise<StepResult<T>> | StepResult<T>;

export type Step<T> = {
  name: StepName;
  action: StepAction<T>;
};

export type StepTickResult = {
  status: "done" | "continue";
  findings?: Finding[];
};

export type CheckTask = {
  metadata: CheckMetadata;
  tick: () => Promise<StepTickResult>;
  getFindings: () => Finding[];
  getOutput: () => CheckOutput;
  getTarget: () => ScanTarget;
  getCurrentStepName: () => string | undefined;
  getCurrentState: () => JSONSerializable;
};

export type RunState<T> = {
  state: T;
  nextStep: StepName | undefined;
  findings: Finding[];
};

export type CheckOutput = JSONSerializable | undefined;
