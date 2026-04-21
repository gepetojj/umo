import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { usersTable } from "./users";

export const subscriptionsTable = pgTable("subscriptions", {
	id: uuid("id").primaryKey(),
	stripeSubscriptionId: text("stripe_subscription_id").unique().notNull(),
	stripeSeatsSubscriptionItemId: text("stripe_seats_subscription_item_id"),
	userId: uuid("user_id").references(() => usersTable.id, {
		onDelete: "cascade",
	}),
	status: text("status").notNull(),
	plan: text("plan").notNull(),
	periodStart: timestamp("period_start").notNull(),
	periodEnd: timestamp("period_end").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const subscriptionsRelations = relations(
	subscriptionsTable,
	({ one }) => ({
		user: one(usersTable, {
			fields: [subscriptionsTable.userId],
			references: [usersTable.id],
		}),
	}),
);
