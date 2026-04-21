import { z } from "zod";

export const updateMeetingDurationSchema = z.object({
	meetingId: z.string().uuid(),
	durationSeconds: z.number().int().min(0),
	totalChunks: z.number().int().min(0),
});
