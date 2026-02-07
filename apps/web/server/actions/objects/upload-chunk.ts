"use server";

import { randomUUID } from "node:crypto";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";
import { objectsTable } from "@/server/db/schema/objects";
import { env } from "@/server/env";
import { s3 } from "@/server/s3";

const schema = z.object({
	meetingId: z.string(),
	chunkIndex: z.coerce.number().int().min(0),
});

/**
 * Uploads an audio chunk to S3 and saves metadata to the database.
 * Transcription is NOT done here — it happens later via processTranscriptions
 * after all chunks are uploaded and recording is finalized.
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
	const sizeBytes = buffer.length;
	const contentType = chunk.type || "audio/webm";

	const [meeting] = await db
		.select({ id: meetingsTable.id })
		.from(meetingsTable)
		.where(eq(meetingsTable.id, meetingId))
		.limit(1);
	if (!meeting) {
		throw new Error("Meeting not found");
	}

	const key = `meetings/${meetingId}/chunks/${chunkIndex}`;

	await s3.send(
		new PutObjectCommand({
			Bucket: env.S3_BUCKET,
			Key: key,
			Body: buffer,
			ContentType: contentType,
		}),
	);

	await db.insert(objectsTable).values({
		id: randomUUID(),
		meetingId,
		key,
		sizeBytes,
		contentType,
		chunkIndex,
	});

	return { ok: true };
};
