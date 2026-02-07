"use server";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/server/db";
import { transcriptionsTable } from "@/server/db/schema/transcriptions";

/**
 * Returns the final transcription text for a meeting, or null if none.
 * Used for chat system context and summary generation.
 */
export async function getTranscriptionContent(
	meetingId: string,
): Promise<string | null> {
	const [row] = await db
		.select({ content: transcriptionsTable.content })
		.from(transcriptionsTable)
		.where(
			and(
				eq(transcriptionsTable.meetingId, meetingId),
				isNull(transcriptionsTable.chunkIndex),
			),
		)
		.limit(1);

	return row?.content ?? null;
}
