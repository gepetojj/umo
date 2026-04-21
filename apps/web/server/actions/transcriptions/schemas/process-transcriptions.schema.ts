import { z } from "zod";

export const processTranscriptionsSchema = z.object({
	meetingId: z.string().uuid(),
});
