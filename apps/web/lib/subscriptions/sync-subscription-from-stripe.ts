import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { getPlanIdFromPriceId } from "@/lib/plans";
import { db } from "@/server/db";
import { subscriptionsTable } from "@/server/db/schema/subscriptions";
import { usersTable } from "@/server/db/schema/users";

export async function syncSubscriptionFromStripe(
	subscription: Stripe.Subscription,
) {
	const customerId =
		typeof subscription.customer === "string"
			? subscription.customer
			: subscription.customer.id;

	const [user] = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.stripeId, customerId))
		.limit(1);

	if (!user) {
		console.error(
			`[stripe] syncSubscriptionFromStripe: no user for customer ${customerId}`,
		);
		return;
	}

	const priceId = subscription.items.data[0]?.price?.id;
	const plan = getPlanIdFromPriceId(priceId);
	if (!plan) {
		console.error(
			`[stripe] syncSubscriptionFromStripe: unknown price id ${priceId}`,
		);
		return;
	}

	const raw = subscription as unknown as {
		current_period_start: number;
		current_period_end: number;
	};

	const row = {
		stripeSubscriptionId: subscription.id,
		userId: user.id,
		status: subscription.status,
		plan,
		periodStart: new Date(raw.current_period_start * 1000),
		periodEnd: new Date(raw.current_period_end * 1000),
	};

	await db
		.insert(subscriptionsTable)
		.values({
			id: randomUUID(),
			...row,
		})
		.onConflictDoUpdate({
			target: subscriptionsTable.stripeSubscriptionId,
			set: {
				userId: row.userId,
				status: row.status,
				plan: row.plan,
				periodStart: row.periodStart,
				periodEnd: row.periodEnd,
				updatedAt: new Date(),
			},
		});
}
