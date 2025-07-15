import { z } from "zod";

import { ScanAggressivitySchema, SeveritySchema } from "./common";

export const OverrideSchema = z.object({
  enabled: z.boolean(),
  checkID: z.string().min(1),
});

export const PresetSchema = z.object({
  name: z.string().min(1),
  active: z.array(OverrideSchema),
  passive: z.array(OverrideSchema),
});

export const UserConfigSchema = z.object({
  passive: z.object({
    enabled: z.boolean(),
    aggressivity: ScanAggressivitySchema,
    inScopeOnly: z.boolean(),
    concurrentChecks: z.number().int().min(1).max(100),
    concurrentRequests: z.number().int().min(1).max(100),
    overrides: z.array(OverrideSchema),
    severities: z.array(SeveritySchema),
  }),
  active: z.object({
    overrides: z.array(OverrideSchema),
  }),
  presets: z.array(PresetSchema),
});

export const PartialUserConfigSchema = UserConfigSchema.partial();

export const UpdateUserConfigParamsSchema = z.object({
  config: PartialUserConfigSchema,
});
