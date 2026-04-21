import { randomUUID } from "node:crypto";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { and, eq } from "drizzle-orm";
import { FatalError } from "workflow";

import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";
import { objectsTable } from "@/server/db/schema/objects";
import { env } from "@/server/env";
import { s3 } from "@/server/s3";

export type PersistAudioChunkInput = {
	meetingId: string;
	chunkIndex: number;
	contentType: string;
	audio: ArrayBuffer;
};

async function persistAudioChunkStep(input: PersistAudioChunkInput) {
	"use step";

	const { meetingId, chunkIndex, contentType, audio } = input;
	const buffer = Buffer.from(audio);

	const [existingChunk] = await db
		.select({ id: objectsTable.id })
		.from(objectsTable)
		.where(
			and(
				eq(objectsTable.meetingId, meetingId),
				eq(objectsTable.chunkIndex, chunkIndex),
			),
		)
		.limit(1);

	if (existingChunk) {
		return { ok: true as const, deduped: true as const };
	}

	const [meeting] = await db
		.select({ id: meetingsTable.id })
		.from(meetingsTable)
		.where(eq(meetingsTable.id, meetingId))
		.limit(1);

	if (!meeting) {
		throw new FatalError("Meeting not found");
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
		sizeBytes: buffer.length,
		contentType,
		chunkIndex,
	});

	return { ok: true as const, deduped: false as const };
}

export async function persistAudioChunkWorkflow(input: PersistAudioChunkInput) {
	"use workflow";

	await persistAudioChunkStep(input);
	return { ok: true as const };
}
