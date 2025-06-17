import { type ScanStrength } from "../../api/types";

export type RunOptions = {
  strength: ScanStrength;
};

export enum RunnerState {
  IDLE,
  RUNNING,
  STOPPED,
}
