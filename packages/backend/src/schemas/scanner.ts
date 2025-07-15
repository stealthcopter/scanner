import { z } from "zod";

import { IdSchema, ScanAggressivitySchema, SeveritySchema } from "./common";

export const ScanConfigSchema = z.object({
  aggressivity: ScanAggressivitySchema,
  inScopeOnly: z.boolean(),
  concurrentChecks: z.number().int().min(1).max(100),
  concurrentRequests: z.number().int().min(1).max(100),
  concurrentTargets: z.number().int().min(1).max(100),
  requestsDelayMs: z.number().int().min(0),
  scanTimeout: z.number().int().min(1),
  checkTimeout: z.number().int().min(1),
  severities: z.array(SeveritySchema).min(1),
});

export const ScanRequestPayloadSchema = z.object({
  requestIDs: z.array(z.string().min(1)).min(1),
  scanConfig: ScanConfigSchema,
  title: z.string().min(1).max(100),
});

export const SessionTitleSchema = z.string().min(1).max(100);

export const StartActiveScanParamsSchema = z.object({
  payload: ScanRequestPayloadSchema,
});

export const GetScanSessionParamsSchema = z.object({
  id: IdSchema,
});

export const CancelScanSessionParamsSchema = z.object({
  id: IdSchema,
});

export const DeleteScanSessionParamsSchema = z.object({
  id: IdSchema,
});

export const UpdateSessionTitleParamsSchema = z.object({
  id: IdSchema,
  title: SessionTitleSchema,
});

export const GetRequestResponseParamsSchema = z.object({
  requestId: IdSchema,
});
