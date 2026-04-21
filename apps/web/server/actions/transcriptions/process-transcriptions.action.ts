"use server";

import { start } from "workflow/api";

import { authActionClient } from "@/server/actions/safe-action";
import { processTranscriptionsSchema } from "@/server/actions/transcriptions/schemas/process-transcriptions.schema";
import { meetingTranscriptionWorkflow } from "@/workflows/meeting-transcription";

/**
 * Enqueues durable transcription for a meeting (download chunks, Whisper, title, summary).
 * Returns immediately with a workflow run id for observability / status polling.
 */
export const processTranscriptionsAction = authActionClient
	.inputSchema(processTranscriptionsSchema)
	.action(async ({ parsedInput: { meetingId } }) => {
		const run = await start(meetingTranscriptionWorkflow, [meetingId]);
		return { runId: run.runId };
	});
