import { z } from "zod";

export const registerUploadSchema = z.object({
	meetingId: z.string().uuid(),
	key: z.string().min(1),
	sizeBytes: z.number().int().min(0),
	contentType: z.string().min(1),
});
