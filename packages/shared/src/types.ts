import { type ScanStrength, type ScanType } from "engine";

export type UserConfigDTO = {
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

export type Result<T> =
  | { kind: "Error"; error: string }
  | { kind: "Success"; value: T };

export function ok<T>(value: T): Result<T> {
  return { kind: "Success", value };
}

export function error<T>(error: string): Result<T> {
  return { kind: "Error", error };
}
