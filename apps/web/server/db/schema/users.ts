import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { subscriptionsTable } from "./subscriptions";

export const usersTable = pgTable("users", {
	id: uuid("id").primaryKey(),
	clerkId: text("clerk_id").unique().notNull(),
	fullName: text("full_name").notNull(),
	email: text("email").unique().notNull(),
	avatarUrl: text("avatar_url"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
	subscriptions: many(subscriptionsTable),
}));
