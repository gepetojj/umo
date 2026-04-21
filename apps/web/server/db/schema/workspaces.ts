import { relations } from "drizzle-orm";
import {
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import { usersTable } from "./users";

export const workspacesTable = pgTable("workspaces", {
	id: uuid("id").primaryKey(),
	ownerUserId: uuid("owner_user_id")
		.notNull()
		.unique()
		.references(() => usersTable.id, { onDelete: "cascade" }),
	name: text("name"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const workspaceMembersTable = pgTable(
	"workspace_members",
	{
		id: uuid("id").primaryKey(),
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspacesTable.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		/** owner | member */
		role: text("role").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(t) => [
		uniqueIndex("workspace_members_workspace_user_unique").on(
			t.workspaceId,
			t.userId,
		),
	],
);

export const workspaceInvitationsTable = pgTable("workspace_invitations", {
	id: uuid("id").primaryKey(),
	workspaceId: uuid("workspace_id")
		.notNull()
		.references(() => workspacesTable.id, { onDelete: "cascade" }),
	email: text("email").notNull(),
	token: text("token").notNull().unique(),
	invitedByUserId: uuid("invited_by_user_id")
		.notNull()
		.references(() => usersTable.id, { onDelete: "cascade" }),
	expiresAt: timestamp("expires_at").notNull(),
	acceptedAt: timestamp("accepted_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workspacesRelations = relations(
	workspacesTable,
	({ one, many }) => ({
		owner: one(usersTable, {
			fields: [workspacesTable.ownerUserId],
			references: [usersTable.id],
		}),
		members: many(workspaceMembersTable),
		invitations: many(workspaceInvitationsTable),
	}),
);

export const workspaceMembersRelations = relations(
	workspaceMembersTable,
	({ one }) => ({
		workspace: one(workspacesTable, {
			fields: [workspaceMembersTable.workspaceId],
			references: [workspacesTable.id],
		}),
		user: one(usersTable, {
			fields: [workspaceMembersTable.userId],
			references: [usersTable.id],
		}),
	}),
);

export const workspaceInvitationsRelations = relations(
	workspaceInvitationsTable,
	({ one }) => ({
		workspace: one(workspacesTable, {
			fields: [workspaceInvitationsTable.workspaceId],
			references: [workspacesTable.id],
		}),
		invitedBy: one(usersTable, {
			fields: [workspaceInvitationsTable.invitedByUserId],
			references: [usersTable.id],
		}),
	}),
);
