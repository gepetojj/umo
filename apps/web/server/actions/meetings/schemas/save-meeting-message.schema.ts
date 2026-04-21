import { z } from "zod";

export const saveMeetingMessageSchema = z.object({
	meetingId: z.string().uuid(),
	message: z.object({
		id: z.string(),
		role: z.enum(["user", "assistant", "system"]),
		parts: z.array(z.unknown()),
	}),
});
