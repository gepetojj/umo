"use server";

import { z } from "zod";

import { processAllTranscriptions } from "@/server/transcriptions/transcribe-chunk";

const schema = z.object({
	meetingId: z.string(),
});

/**
 * Server action to process all pending chunk transcriptions for a meeting.
 * Downloads audio from S3, transcribes in parallel, merges results, and generates title.
 */
export const processTranscriptions = async (data: z.infer<typeof schema>) => {
	const { meetingId } = schema.parse(data);
	await processAllTranscriptions(meetingId);
};
