import { z } from "zod";

export const createMeetingSchema = z.object({
	title: z.string().min(1).max(500),
});
