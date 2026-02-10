import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
