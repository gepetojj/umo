"use server";

import type { UIMessage } from "ai";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { meetingMessagesTable } from "@/server/db/schema/meeting-messages";

/**
 * Saves a single chat message (e.g. assistant message after stream completes).
 * Idempotent: if a message with the same id already exists, it is not duplicated.
 */
export async function saveMeetingMessage(
	meetingId: string,
	message: UIMessage,
): Promise<{ ok: boolean; error?: string }> {
	try {
		const [existing] = await db
			.select({ id: meetingMessagesTable.id })
			.from(meetingMessagesTable)
			.where(eq(meetingMessagesTable.id, message.id))
			.limit(1);

		if (existing) {
			return { ok: true };
		}

		const parts = Array.isArray(message.parts) ? message.parts : [];
		await db.insert(meetingMessagesTable).values({
			id: message.id,
			meetingId,
			role: message.role,
			parts,
		});
		return { ok: true };
	} catch (err) {
		console.error("saveMeetingMessage error:", err);
		return {
			ok: false,
			error:
				err instanceof Error ? err.message : "Failed to save message",
		};
	}
}
