import { z } from "zod";

export const uploadChunkSchema = z.object({
	meetingId: z.string().uuid(),
	chunkIndex: z.number().int().min(0),
	chunk: z.instanceof(Blob),
});
