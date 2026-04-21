import { and, desc, eq, gte, inArray } from "drizzle-orm";

import { db } from "@/server/db";
import { subscriptionsTable } from "@/server/db/schema/subscriptions";

const ACCESS_STATUSES = ["active", "trialing"] as const;

/** Paid access: active or trialing with a current period that has not ended. */
export async function getActiveSubscription(userId: string) {
	const now = new Date();
	const [subscription] = await db
		.select()
		.from(subscriptionsTable)
		.where(
			and(
				eq(subscriptionsTable.userId, userId),
				inArray(subscriptionsTable.status, [...ACCESS_STATUSES]),
				gte(subscriptionsTable.periodEnd, now),
			),
		)
		.orderBy(desc(subscriptionsTable.periodEnd))
		.limit(1);

	return subscription ?? null;
}
