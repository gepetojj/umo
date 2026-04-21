import { z } from "zod";

export const removeMemberSchema = z.object({
	memberUserId: z.uuid(),
});
