import { z } from "zod";

import { planIdSchema } from "./plan-id.schema";

export const createCheckoutSessionSchema = z.object({
	planId: planIdSchema,
});
