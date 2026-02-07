import { relations } from "drizzle-orm";
import {
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { meetingsTable } from "./meetings";

export const objectTypeEnum = pgEnum("object_type", ["recording"]);

export const objectsTable = pgTable("objects", {
	id: uuid("id").primaryKey(),
	meetingId: uuid("meeting_id").references(() => meetingsTable.id, {
		onDelete: "cascade",
	}),
	type: objectTypeEnum("type").default("recording").notNull(),
	key: text("key").notNull(),
	sizeBytes: integer("size_bytes").notNull(),
	contentType: text("content_type").notNull(),
	chunkIndex: integer("chunk_index"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const objectsRelations = relations(objectsTable, ({ one }) => ({
	meeting: one(meetingsTable, {
		fields: [objectsTable.meetingId],
		references: [meetingsTable.id],
	}),
}));
