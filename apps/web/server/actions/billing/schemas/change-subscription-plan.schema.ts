import { z } from "zod";

import { planIdSchema } from "./plan-id.schema";

export const changeSubscriptionPlanSchema = z.object({
	planId: planIdSchema,
});
