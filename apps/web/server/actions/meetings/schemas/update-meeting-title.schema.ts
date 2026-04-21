import { z } from "zod";

export const updateMeetingTitleSchema = z.object({
	meetingId: z.string().uuid(),
	title: z.string().min(1).max(500),
});
