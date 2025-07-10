import { type InterruptReason } from "../types/runner";

export enum CheckDefinitionErrorCode {
  NO_STEPS_DEFINED = "NO_STEPS_DEFINED",
  STEP_NOT_FOUND = "STEP_NOT_FOUND",
  INVALID_METADATA = "INVALID_METADATA",
  INVALID_STATE = "INVALID_STATE",
  NO_NEXT_STEP = "NO_NEXT_STEP",
}

export class CheckDefinitionError extends Error {
  public code: CheckDefinitionErrorCode;

  constructor(message: string, code: CheckDefinitionErrorCode) {
    super(message);
    this.name = "CheckDefinitionError";
    this.code = code;
  }
}

export enum ScanRegistryErrorCode {
  CHECK_DEPENDENCY_NOT_FOUND = "CHECK_DEPENDENCY_NOT_FOUND",
  NO_CHECKS_REGISTERED = "NO_CHECKS_REGISTERED",
}

export class ScanRegistryError extends Error {
  public code: ScanRegistryErrorCode;

  constructor(message: string, code: ScanRegistryErrorCode) {
    super(message);
    this.name = "ScanRegistryError";
    this.code = code;
  }
}

export enum ScanRunnableErrorCode {
  INTERRUPTED = "INTERRUPTED",
  REQUEST_NOT_FOUND = "REQUEST_NOT_FOUND",
  SCAN_ALREADY_RUNNING = "SCAN_ALREADY_RUNNING",
  RUNTIME_ERROR = "RUNTIME_ERROR",
  UNKNOWN_CHECK_ERROR = "UNKNOWN_CHECK_ERROR",
  REQUEST_FAILED = "REQUEST_FAILED",
  NO_ACTIVE_CHECK_ID = "NO_ACTIVE_CHECK_ID",
}

export class ScanRunnableError extends Error {
  public code: ScanRunnableErrorCode;

  constructor(message: string, code: ScanRunnableErrorCode) {
    super(message);
    this.name = "ScanRunnableError";
    this.code = code;
  }
}

export class ScanRunnableInterruptedError extends ScanRunnableError {
  public reason: InterruptReason;

  constructor(reason: InterruptReason) {
    super("Scan interrupted", ScanRunnableErrorCode.INTERRUPTED);
    this.reason = reason;
  }
}

export class ScanRuntimeError extends ScanRunnableError {
  public errors: Error[];

  constructor(errors: Error[]) {
    super("Scan runtime error", ScanRunnableErrorCode.RUNTIME_ERROR);
    this.errors = errors;
  }
}
