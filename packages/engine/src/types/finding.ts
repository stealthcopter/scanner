export enum Severity {
  INFO = "info",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export type Finding = {
  name: string;
  description: string;
  severity: Severity;
  requestID?: string;
};
