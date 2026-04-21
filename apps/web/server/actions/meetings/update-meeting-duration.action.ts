"use server";

import { eq } from "drizzle-orm";

import { updateMeetingDurationSchema } from "@/server/actions/meetings/schemas/update-meeting-duration.schema";
import { authActionClient } from "@/server/actions/safe-action";
import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";

/**
 * Updates the meeting's duration and total chunk count after recording stops.
 * Transcription processing is triggered separately by the meeting page.
 */
export const updateMeetingDurationAction = authActionClient
	.inputSchema(updateMeetingDurationSchema)
	.action(
		async ({
			parsedInput: { meetingId, durationSeconds, totalChunks },
		}) => {
			await db
				.update(meetingsTable)
				.set({ durationSeconds, totalChunks, updatedAt: new Date() })
				.where(eq(meetingsTable.id, meetingId));
		},
	);
