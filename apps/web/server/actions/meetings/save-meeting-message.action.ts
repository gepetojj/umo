"use server";

import { eq } from "drizzle-orm";

import { saveMeetingMessageSchema } from "@/server/actions/meetings/schemas/save-meeting-message.schema";
import { authActionClient } from "@/server/actions/safe-action";
import { db } from "@/server/db";
import { meetingMessagesTable } from "@/server/db/schema/meeting-messages";

/**
 * Saves a single chat message (e.g. assistant message after stream completes).
 * Idempotent: if a message with the same id already exists, it is not duplicated.
 */
export const saveMeetingMessageAction = authActionClient
	.inputSchema(saveMeetingMessageSchema)
	.action(async ({ parsedInput: { meetingId, message } }) => {
		const [existing] = await db
			.select({ id: meetingMessagesTable.id })
			.from(meetingMessagesTable)
			.where(eq(meetingMessagesTable.id, message.id))
			.limit(1);

		if (existing) {
			return;
		}

		const parts = Array.isArray(message.parts) ? message.parts : [];
		await db.insert(meetingMessagesTable).values({
			id: message.id,
			meetingId,
			role: message.role,
			parts,
		});
	});
