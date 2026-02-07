import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { meetingMessagesTable } from "./meeting-messages";
import { objectsTable } from "./objects";
import { transcriptionsTable } from "./transcriptions";

export const meetingsTable = pgTable("meetings", {
	id: uuid("id").primaryKey(),
	title: text("title").notNull(),
	durationSeconds: integer("duration_seconds").notNull().default(0),
	totalChunks: integer("total_chunks"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const meetingsRelations = relations(meetingsTable, ({ many, one }) => ({
	meetingMessages: many(meetingMessagesTable),
	objects: many(objectsTable),
	transcriptions: one(transcriptionsTable),
}));
