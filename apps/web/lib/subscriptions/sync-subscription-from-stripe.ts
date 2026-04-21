import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { findSeatsSubscriptionItem } from "@/lib/billing/stripe-subscription-items";
import { syncStripeSeatQuantityForWorkspaceOwner } from "@/lib/billing/sync-seat-billing";
import { sendSubscriptionThankYouEmail } from "@/lib/email/send-subscription-thank-you";
import { getPlanIdFromPriceId, type PlanId } from "@/lib/plans";
import { ensureWorkspaceWithOwnerMember } from "@/lib/workspace/ensure-workspace";
import { db } from "@/server/db";
import { subscriptionsTable } from "@/server/db/schema/subscriptions";
import { usersTable } from "@/server/db/schema/users";
import { stripe } from "@/server/stripe";

function inferPlanFromStripeSubscription(
	subscription: Stripe.Subscription,
): PlanId | null {
	let starter: PlanId | null = null;
	for (const item of subscription.items.data) {
		const pid = item.price?.id;
		if (!pid) continue;
		const p = getPlanIdFromPriceId(pid);
		if (p === "gold") return "gold";
		if (p === "starter") starter = "starter";
	}
	return starter;
}

function isSubscriptionLiveStatus(status: string) {
	return status === "active" || status === "trialing";
}

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

	const plan = inferPlanFromStripeSubscription(subscription);
	if (!plan) {
		console.error(
			`[stripe] syncSubscriptionFromStripe: could not infer plan from items`,
		);
		return;
	}

	let seatsItemId = findSeatsSubscriptionItem(subscription)?.id ?? null;
	// Starter não deve ter add-on de vagas; remove linha órfã (ex.: portal Stripe).
	if (plan === "starter" && seatsItemId) {
		await stripe.subscriptionItems.del(seatsItemId);
		seatsItemId = null;
	}

	const [existingSubscription] = await db
		.select()
		.from(subscriptionsTable)
		.where(eq(subscriptionsTable.stripeSubscriptionId, subscription.id))
		.limit(1);

	const wasLive = existingSubscription
		? isSubscriptionLiveStatus(existingSubscription.status)
		: false;

	const row = {
		stripeSubscriptionId: subscription.id,
		userId: user.id,
		status: subscription.status,
		plan,
		periodStart: new Date(
			subscription.items.data[0].current_period_start * 1000,
		),
		periodEnd: new Date(
			subscription.items.data[0].current_period_end * 1000,
		),
		stripeSeatsSubscriptionItemId: seatsItemId,
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
				stripeSeatsSubscriptionItemId:
					row.stripeSeatsSubscriptionItemId,
				updatedAt: new Date(),
			},
		});

	const isLive = isSubscriptionLiveStatus(subscription.status);
	if (plan && isLive && !wasLive) {
		try {
			await sendSubscriptionThankYouEmail({
				to: user.email,
				fullName: user.fullName,
				planId: plan,
			});
		} catch (err) {
			console.error("[email] subscription thank-you failed:", err);
		}
	}

	if (plan === "gold") {
		await ensureWorkspaceWithOwnerMember(user.id);
		await syncStripeSeatQuantityForWorkspaceOwner(user.id);
	}
}
