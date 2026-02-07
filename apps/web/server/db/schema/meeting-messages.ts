import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { meetingsTable } from "./meetings";

/**
 * Stores chat messages for a meeting (AI summary + user/assistant conversation).
 * id is text to accept AI SDK–generated ids (nanoid-style); meetingId stays uuid.
 * parts: UIMessage-style parts (text, file, tool-*, etc.) as JSON for flexibility.
 */
export const meetingMessagesTable = pgTable("meeting_messages", {
	id: text("id").primaryKey(),
	meetingId: uuid("meeting_id")
		.notNull()
		.references(() => meetingsTable.id, { onDelete: "cascade" }),
	role: text("role").notNull(), // 'user' | 'assistant' | 'system'
	parts: jsonb("parts").notNull().$type<unknown[]>(), // UIMessage parts
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const meetingMessagesRelations = relations(
	meetingMessagesTable,
	({ one }) => ({
		meeting: one(meetingsTable, {
			fields: [meetingMessagesTable.meetingId],
			references: [meetingsTable.id],
		}),
	}),
);
