"use server";

import { start } from "workflow/api";
import { z } from "zod";

import { meetingTranscriptionWorkflow } from "@/workflows/meeting-transcription";

const schema = z.object({
	meetingId: z.string(),
});

/**
 * Enqueues durable transcription for a meeting (download chunks, Whisper, title, summary).
 * Returns immediately with a workflow run id for observability / status polling.
 */
export const processTranscriptions = async (data: z.infer<typeof schema>) => {
	const { meetingId } = schema.parse(data);
	const run = await start(meetingTranscriptionWorkflow, [meetingId]);
	return { runId: run.runId };
};
