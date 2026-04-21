import { and, desc, eq, gte, lt, or } from "drizzle-orm";

import { db } from "@/server/db";
import { subscriptionsTable } from "@/server/db/schema/subscriptions";

export async function getActiveSubscription(userId: string) {
	const [subscription] = await db
		.select()
		.from(subscriptionsTable)
		.where(
			and(
				eq(subscriptionsTable.userId, userId),
				or(
					eq(subscriptionsTable.status, "active"),
					eq(subscriptionsTable.status, "trialing"),
				),
				gte(subscriptionsTable.periodStart, new Date()),
				lt(subscriptionsTable.periodEnd, new Date()),
			),
		)
		.orderBy(desc(subscriptionsTable.periodEnd))
		.limit(1);

	return subscription || null;
}
