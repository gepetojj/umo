import { z } from "zod";

export const meetingIdSchema = z.object({
	meetingId: z.string().uuid(),
});
