"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";
import { objectsTable } from "@/server/db/schema/objects";
import { env } from "@/server/env";
import { s3PublicUrl } from "@/server/s3";

const schema = z.object({
	meetingId: z.string(),
});

export const generateTranscription = async (data: z.infer<typeof schema>) => {
	const { meetingId } = schema.parse(data);

	const [meeting] = await db
		.select()
		.from(meetingsTable)
		.where(eq(meetingsTable.id, meetingId))
		.limit(1);
	if (!meeting) {
		throw new Error("Meeting not found");
	}

	const [recording] = await db
		.select({ key: objectsTable.key })
		.from(objectsTable)
		.where(
			and(
				eq(objectsTable.meetingId, meetingId),
				eq(objectsTable.type, "recording"),
			),
		)
		.limit(1);
	if (!recording) {
		throw new Error("Recording not found");
	}

	const transcription = await fetch(env.TRANSCRIPTIONS_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: env.TRANSCRIPTIONS_API_KEY,
		},
		body: JSON.stringify({
			meetingId,
			recordingUrl: s3PublicUrl(recording.key),
		}),
	});
	if (!transcription.ok) {
		console.error(await transcription.text());
		throw new Error(
			`Failed to generate transcription: ${transcription.statusText}`,
		);
	}
};
