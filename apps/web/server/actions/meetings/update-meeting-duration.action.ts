"use server";

import { eq } from "drizzle-orm";

import { updateMeetingDurationSchema } from "@/server/actions/meetings/schemas/update-meeting-duration.schema";
import { AuthError, authActionClient } from "@/server/actions/safe-action";
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
			ctx,
			parsedInput: { meetingId, durationSeconds, totalChunks },
		}) => {
			const [meeting] = await db
				.select()
				.from(meetingsTable)
				.where(eq(meetingsTable.id, meetingId))
				.limit(1);
			if (!meeting) {
				throw new AuthError("Reunião não encontrada.");
			}
			if (meeting.creatorUserId !== ctx.user.id) {
				throw new AuthError(
					"Só quem criou a reunião pode atualizar a gravação.",
				);
			}

			await db
				.update(meetingsTable)
				.set({ durationSeconds, totalChunks, updatedAt: new Date() })
				.where(eq(meetingsTable.id, meetingId));
		},
	);
