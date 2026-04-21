"use server";

import { start } from "workflow/api";
import { z } from "zod";

import { persistAudioChunkWorkflow } from "@/workflows/persist-audio-chunk";

const schema = z.object({
	meetingId: z.string(),
	chunkIndex: z.coerce.number().int().min(0),
});

/**
 * Uploads an audio chunk via a durable workflow (S3 + DB in a retryable step).
 * Awaits workflow completion so callers (e.g. recorder stop) only resolve after the chunk is persisted.
 * Transcription runs separately via the processTranscriptions server action.
 */
export const uploadChunk = async (formData: FormData) => {
	const raw = {
		meetingId: formData.get("meetingId"),
		chunkIndex: formData.get("chunkIndex"),
	};
	const { meetingId, chunkIndex } = schema.parse(raw);

	const chunk = formData.get("chunk");
	if (!chunk || !(chunk instanceof Blob)) {
		throw new Error("Missing or invalid chunk");
	}
	const buffer = Buffer.from(await chunk.arrayBuffer());
	const contentType = chunk.type || "audio/webm";

	const audio = new Uint8Array(buffer).buffer;

	const run = await start(persistAudioChunkWorkflow, [
		{ meetingId, chunkIndex, contentType, audio },
	]);

	await run.returnValue;

	return { ok: true };
};
