import { z } from "zod";

import { CheckTypeSchema } from "./common";

export const GetChecksOptionsSchema = z
  .object({
    type: CheckTypeSchema.optional(),
    include: z.array(z.string()).optional(),
    exclude: z.array(z.string()).optional(),
  })
  .optional();
