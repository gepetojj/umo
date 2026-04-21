import { z } from "zod";

export const getUploadUrlSchema = z.object({
	meetingId: z.string().uuid(),
});
