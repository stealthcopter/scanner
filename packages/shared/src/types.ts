import { type Finding, type ScanStrength, type ScanType } from "engine";

export type UserConfig = {
  passive: {
    enabled: boolean;
    strength: ScanStrength;
    overrides: Record<string, { passive: boolean; active: boolean }>;
  };
};

export type SelectOptions = {
  type?: ScanType;
  include?: string[];
  exclude?: string[];
  returnMetadata?: boolean;
};

export type GetChecksOptions = Pick<
  SelectOptions,
  "type" | "include" | "exclude"
>;

export type ScanState =
  | { kind: "Pending"; createdAt: number }
  | { kind: "Running"; createdAt: number; startedAt: number }
  | {
      kind: "Done";
      createdAt: number;
      startedAt: number;
      finishedAt: number;
      findings: Finding[];
    }
  | { kind: "Error"; createdAt: number; error: string };

export type Result<T> =
  | { kind: "Error"; error: string }
  | { kind: "Success"; value: T };

export function ok<T>(value: T): Result<T> {
  return { kind: "Success", value };
}

export function error<T>(error: string): Result<T> {
  return { kind: "Error", error };
}
