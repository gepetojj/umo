import { desc, eq } from "drizzle-orm";

import { db } from "@/server/db";
import { subscriptionsTable } from "@/server/db/schema/subscriptions";

import { getActiveSubscription } from "./get-active-subscription";

/** Subscription row used for billing UI (includes canceled / ended for history). */
export async function getPrimarySubscriptionForBilling(userId: string) {
	const active = await getActiveSubscription(userId);
	if (active) return active;

	const [latest] = await db
		.select()
		.from(subscriptionsTable)
		.where(eq(subscriptionsTable.userId, userId))
		.orderBy(desc(subscriptionsTable.updatedAt))
		.limit(1);

	return latest ?? null;
}
