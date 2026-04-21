import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { meetingMessagesTable } from "./meeting-messages";
import { objectsTable } from "./objects";
import { transcriptionsTable } from "./transcriptions";
import { usersTable } from "./users";
import { workspacesTable } from "./workspaces";

export const meetingsTable = pgTable("meetings", {
	id: uuid("id").primaryKey(),
	title: text("title").notNull(),
	durationSeconds: integer("duration_seconds").notNull().default(0),
	totalChunks: integer("total_chunks"),
	workspaceId: uuid("workspace_id").references(() => workspacesTable.id, {
		onDelete: "set null",
	}),
	creatorUserId: uuid("creator_user_id").references(() => usersTable.id, {
		onDelete: "set null",
	}),
	visibility: text("visibility").notNull().default("workspace"),
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
	workspace: one(workspacesTable, {
		fields: [meetingsTable.workspaceId],
		references: [workspacesTable.id],
	}),
	creator: one(usersTable, {
		fields: [meetingsTable.creatorUserId],
		references: [usersTable.id],
	}),
}));
