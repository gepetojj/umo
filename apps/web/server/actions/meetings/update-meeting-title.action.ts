"use server";

import { eq } from "drizzle-orm";

import { updateMeetingTitleSchema } from "@/server/actions/meetings/schemas/update-meeting-title.schema";
import { authActionClient } from "@/server/actions/safe-action";
import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";

export const updateMeetingTitleAction = authActionClient
	.inputSchema(updateMeetingTitleSchema)
	.action(async ({ parsedInput: { meetingId, title } }) => {
		await db
			.update(meetingsTable)
			.set({ title, updatedAt: new Date() })
			.where(eq(meetingsTable.id, meetingId));
	});
