"use server";

import { and, asc, eq, isNull } from "drizzle-orm";

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

	const recordings = await db
		.select({ key: objectsTable.key, chunkIndex: objectsTable.chunkIndex })
		.from(objectsTable)
		.where(
			and(
				eq(objectsTable.meetingId, meetingId),
				eq(objectsTable.type, "recording"),
			),
		)
		.orderBy(asc(objectsTable.chunkIndex));

	const recordingKey =
		recordings.length > 0 ? (recordings[0]?.key ?? null) : null;
	const recordingChunkKeys =
		recordings.length > 0 ? recordings.map((r) => r.key) : [];

	const [finalTranscription] = await db
		.select({ id: transcriptionsTable.id })
		.from(transcriptionsTable)
		.where(
			and(
				eq(transcriptionsTable.meetingId, meetingId),
				isNull(transcriptionsTable.chunkIndex),
			),
		)
		.limit(1);

	const transcriptionId = finalTranscription?.id ?? null;
	const transcriptionPending = recordings.length > 0 && !finalTranscription;

	return {
		id: meeting.id,
		title: meeting.title,
		durationSeconds: meeting.durationSeconds,
		totalChunks: meeting.totalChunks,
		createdAt: meeting.createdAt.getTime(),
		recordingKey,
		recordingChunkKeys,
		transcriptionId,
		transcriptionPending,
	};
};
