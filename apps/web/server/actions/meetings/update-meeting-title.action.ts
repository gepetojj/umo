"use server";

import { eq } from "drizzle-orm";

import { updateMeetingTitleSchema } from "@/server/actions/meetings/schemas/update-meeting-title.schema";
import { AuthError, authActionClient } from "@/server/actions/safe-action";
import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";

export const updateMeetingTitleAction = authActionClient
	.inputSchema(updateMeetingTitleSchema)
	.action(async ({ ctx, parsedInput: { meetingId, title } }) => {
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
				"Só quem criou a reunião pode editar o título.",
			);
		}

		await db
			.update(meetingsTable)
			.set({ title, updatedAt: new Date() })
			.where(eq(meetingsTable.id, meetingId));
	});
