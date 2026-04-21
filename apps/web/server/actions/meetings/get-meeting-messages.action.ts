"use server";

import type { UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";
import { asc, eq } from "drizzle-orm";

import { meetingIdSchema } from "@/server/actions/meetings/schemas/meeting-id.schema";
import { authActionClient } from "@/server/actions/safe-action";
import { db } from "@/server/db";
import { meetingMessagesTable } from "@/server/db/schema/meeting-messages";

export const getMeetingMessagesAction = authActionClient
	.inputSchema(meetingIdSchema)
	.action(async ({ parsedInput: { meetingId } }) => {
		const rows = await db
			.select({
				id: meetingMessagesTable.id,
				role: meetingMessagesTable.role,
				parts: meetingMessagesTable.parts,
			})
			.from(meetingMessagesTable)
			.where(eq(meetingMessagesTable.meetingId, meetingId))
			.orderBy(asc(meetingMessagesTable.createdAt));

		return rows.map((row) => ({
			id: row.id,
			role: row.role as UIMessage["role"],
			parts: (Array.isArray(row.parts) ? row.parts : []) as UIMessagePart<
				UIDataTypes,
				UITools
			>[],
		})) satisfies UIMessage[];
	});
