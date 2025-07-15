import { z } from "zod";

import { IdSchema } from "./common";

export const GetQueueTaskParamsSchema = z.object({
  id: IdSchema,
});
