"use server";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";
import { objectsTable } from "@/server/db/schema/objects";
import { transcriptionsTable } from "@/server/db/schema/transcriptions";

export const getMeeting = async (meetingId: string) => {
	const [meeting] = await db
		.select()
		.from(meetingsTable)
		.where(eq(meetingsTable.id, meetingId))
		.limit(1);
	if (!meeting) return null;

	const [recording] = await db
		.select({ key: objectsTable.key })
		.from(objectsTable)
		.where(
			and(
				eq(objectsTable.meetingId, meetingId),
				eq(objectsTable.type, "recording"),
			),
		)
		.orderBy(desc(objectsTable.createdAt))
		.limit(1);

	const [transcription] = await db
		.select({ id: transcriptionsTable.id })
		.from(transcriptionsTable)
		.where(eq(transcriptionsTable.meetingId, meetingId))
		.orderBy(desc(transcriptionsTable.createdAt))
		.limit(1);

	return {
		id: meeting.id,
		title: meeting.title,
		durationSeconds: meeting.durationSeconds,
		createdAt: meeting.createdAt.getTime(),
		recordingKey: recording?.key ?? null,
		transcriptionId: transcription?.id ?? null,
	};
};
