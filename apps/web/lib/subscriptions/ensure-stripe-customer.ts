import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { usersTable } from "@/server/db/schema/users";
import { stripe } from "@/server/stripe";

type UserRow = typeof usersTable.$inferSelect;

/**
 * Ensures the user has a Stripe customer id (users created before Stripe
 * integration, or edge cases). Returns the Stripe customer id.
 */
export async function ensureStripeCustomer(user: UserRow): Promise<string> {
	if (user.stripeId) return user.stripeId;

	const customer = await stripe.customers.create({
		email: user.email,
		name: user.fullName,
		metadata: {
			userId: user.id,
		},
	});

	await db
		.update(usersTable)
		.set({ stripeId: customer.id })
		.where(eq(usersTable.id, user.id));

	return customer.id;
}
