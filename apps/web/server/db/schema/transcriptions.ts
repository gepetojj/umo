import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { meetingsTable } from "./meetings";

export const transcriptionsTable = pgTable("transcriptions", {
	id: uuid("id").primaryKey(),
	meetingId: uuid("meeting_id").references(() => meetingsTable.id, {
		onDelete: "cascade",
	}),
	content: text("content").notNull(),
	vtt: text("vtt"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const transcriptionsRelations = relations(
	transcriptionsTable,
	({ one }) => ({
		meeting: one(meetingsTable, {
			fields: [transcriptionsTable.meetingId],
			references: [meetingsTable.id],
		}),
	}),
);
