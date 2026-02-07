"use server";

import type { UIMessage } from "ai";
import { asc, eq } from "drizzle-orm";

import { db } from "@/server/db";
import { meetingMessagesTable } from "@/server/db/schema/meeting-messages";

/**
 * Returns chat messages for a meeting in UIMessage format for useChat initialMessages.
 */
export async function getMeetingMessages(
	meetingId: string,
): Promise<UIMessage[]> {
	const rows = await db
		.select({
			id: meetingMessagesTable.id,
			role: meetingMessagesTable.role,
			parts: meetingMessagesTable.parts,
			createdAt: meetingMessagesTable.createdAt,
		})
		.from(meetingMessagesTable)
		.where(eq(meetingMessagesTable.meetingId, meetingId))
		.orderBy(asc(meetingMessagesTable.createdAt));

	return rows.map((row) => ({
		id: row.id,
		role: row.role as UIMessage["role"],
		parts: Array.isArray(row.parts) ? row.parts : [],
	}));
}
