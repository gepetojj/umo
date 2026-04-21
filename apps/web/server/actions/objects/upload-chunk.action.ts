"use server";

import { start } from "workflow/api";

import { uploadChunkSchema } from "@/server/actions/objects/schemas/upload-chunk.schema";
import { authActionClient } from "@/server/actions/safe-action";
import { persistAudioChunkWorkflow } from "@/workflows/persist-audio-chunk";

/**
 * Uploads an audio chunk via a durable workflow (S3 + DB in a retryable step).
 * Awaits workflow completion so callers (e.g. recorder stop) only resolve after the chunk is persisted.
 * Transcription runs separately via the processTranscriptions server action.
 */
export const uploadChunkAction = authActionClient
	.inputSchema(uploadChunkSchema)
	.action(async ({ parsedInput: { meetingId, chunkIndex, chunk } }) => {
		const buffer = Buffer.from(await chunk.arrayBuffer());
		const contentType = chunk.type || "audio/webm";

		const audio = new Uint8Array(buffer).buffer;

		const run = await start(persistAudioChunkWorkflow, [
			{ meetingId, chunkIndex, contentType, audio },
		]);

		await run.returnValue;
	});
