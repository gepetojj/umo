"use server";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";

/**
 * Updates the meeting's duration and total chunk count after recording stops.
 * Transcription processing is triggered separately by the meeting page.
 */
export const updateMeetingDuration = async (
	meetingId: string,
	durationSeconds: number,
	totalChunks: number,
) => {
	await db
		.update(meetingsTable)
		.set({ durationSeconds, totalChunks, updatedAt: new Date() })
		.where(eq(meetingsTable.id, meetingId));
};
