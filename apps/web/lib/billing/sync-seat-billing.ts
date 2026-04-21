import { and, count, desc, eq, inArray } from "drizzle-orm";

import { findSeatsSubscriptionItem } from "@/lib/billing/stripe-subscription-items";
import { GOLD_INCLUDED_WORKSPACE_SEATS } from "@/lib/entitlements";
import { db } from "@/server/db";
import { subscriptionsTable } from "@/server/db/schema/subscriptions";
import {
	workspaceMembersTable,
	workspacesTable,
} from "@/server/db/schema/workspaces";
import { env } from "@/server/env";
import { stripe } from "@/server/stripe";

/**
 * Ajusta a quantidade do item de "vagas extras" na assinatura Stripe conforme o
 * número de membros do workspace (além das vagas incluídas no Gold).
 */
export async function syncStripeSeatQuantityForWorkspaceOwner(
	ownerUserId: string,
): Promise<void> {
	const [subRow] = await db
		.select()
		.from(subscriptionsTable)
		.where(
			and(
				eq(subscriptionsTable.userId, ownerUserId),
				inArray(subscriptionsTable.status, ["active", "trialing"]),
			),
		)
		.orderBy(desc(subscriptionsTable.periodEnd))
		.limit(1);

	if (!subRow || subRow.plan !== "gold") return;

	const [ws] = await db
		.select({ id: workspacesTable.id })
		.from(workspacesTable)
		.where(eq(workspacesTable.ownerUserId, ownerUserId))
		.limit(1);
	if (!ws) return;

	const [cntRow] = await db
		.select({ n: count() })
		.from(workspaceMembersTable)
		.where(eq(workspaceMembersTable.workspaceId, ws.id));

	const memberCount = Number(cntRow?.n ?? 0);
	const extraSeats = Math.max(0, memberCount - GOLD_INCLUDED_WORKSPACE_SEATS);

	const stripeSub = await stripe.subscriptions.retrieve(
		subRow.stripeSubscriptionId,
		{ expand: ["items.data.price"] },
	);

	const seatItem = findSeatsSubscriptionItem(stripeSub);

	if (extraSeats === 0) {
		if (seatItem) {
			await stripe.subscriptionItems.del(seatItem.id);
			await db
				.update(subscriptionsTable)
				.set({
					stripeSeatsSubscriptionItemId: null,
					updatedAt: new Date(),
				})
				.where(eq(subscriptionsTable.id, subRow.id));
		}
		return;
	}

	if (!seatItem) {
		const created = await stripe.subscriptionItems.create({
			subscription: subRow.stripeSubscriptionId,
			price: env.STRIPE_SEATS_PRICE_ID,
			quantity: extraSeats,
		});
		await db
			.update(subscriptionsTable)
			.set({
				stripeSeatsSubscriptionItemId: created.id,
				updatedAt: new Date(),
			})
			.where(eq(subscriptionsTable.id, subRow.id));
		return;
	}

	if (seatItem.quantity !== extraSeats) {
		await stripe.subscriptionItems.update(seatItem.id, {
			quantity: extraSeats,
		});
	}

	await db
		.update(subscriptionsTable)
		.set({
			stripeSeatsSubscriptionItemId: seatItem.id,
			updatedAt: new Date(),
		})
		.where(eq(subscriptionsTable.id, subRow.id));
}

export async function syncStripeSeatQuantityForWorkspace(
	workspaceId: string,
): Promise<void> {
	const [w] = await db
		.select({ ownerUserId: workspacesTable.ownerUserId })
		.from(workspacesTable)
		.where(eq(workspacesTable.id, workspaceId))
		.limit(1);
	if (!w) return;
	await syncStripeSeatQuantityForWorkspaceOwner(w.ownerUserId);
}
