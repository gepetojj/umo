import {
	getPlanDefinitions,
	type PlanDefinition,
	type PlanId,
} from "@/lib/plans";
import { subscriptionsTable } from "@/server/db/schema/subscriptions";

import { getActiveSubscription } from "./get-active-subscription";
import { getPrimarySubscriptionForBilling } from "./get-primary-subscription";

type SubscriptionRow = typeof subscriptionsTable.$inferSelect;

export type SubscriptionSnapshot = Omit<
	SubscriptionRow,
	"periodStart" | "periodEnd" | "createdAt" | "updatedAt"
> & {
	periodStart: string;
	periodEnd: string;
	createdAt: string;
	updatedAt: string;
};

export type BillingOverviewClient = {
	plans: PlanDefinition[];
	activeSubscription: SubscriptionSnapshot | null;
	displaySubscription: SubscriptionSnapshot | null;
	currentPlanId: PlanId | null;
	canUpgrade: boolean;
};

export type BillingOverview = {
	plans: PlanDefinition[];
	/** Entitlement for product features (paid gate). */
	activeSubscription: Awaited<ReturnType<typeof getActiveSubscription>>;
	/** Row for billing UI (may be canceled / ended for history). */
	displaySubscription: Awaited<
		ReturnType<typeof getPrimarySubscriptionForBilling>
	>;
	currentPlanId: PlanId | null;
	canUpgrade: boolean;
};

function toSubscriptionSnapshot(
	row: SubscriptionRow | null,
): SubscriptionSnapshot | null {
	if (!row) return null;
	return {
		...row,
		periodStart: row.periodStart.toISOString(),
		periodEnd: row.periodEnd.toISOString(),
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

export function toBillingOverviewClient(
	overview: BillingOverview,
): BillingOverviewClient {
	return {
		plans: overview.plans,
		activeSubscription: toSubscriptionSnapshot(overview.activeSubscription),
		displaySubscription: toSubscriptionSnapshot(
			overview.displaySubscription,
		),
		currentPlanId: overview.currentPlanId,
		canUpgrade: overview.canUpgrade,
	};
}

export async function getBillingOverview(
	userId: string,
): Promise<BillingOverview> {
	const plans = getPlanDefinitions();
	const activeSubscription = await getActiveSubscription(userId);
	const displaySubscription = await getPrimarySubscriptionForBilling(userId);

	const currentPlanId: PlanId | null =
		activeSubscription?.plan === "starter" ||
		activeSubscription?.plan === "gold"
			? activeSubscription.plan
			: displaySubscription?.plan === "starter" ||
					displaySubscription?.plan === "gold"
				? displaySubscription.plan
				: null;

	const canUpgrade = activeSubscription?.plan === "starter";

	return {
		plans,
		activeSubscription,
		displaySubscription,
		currentPlanId,
		canUpgrade,
	};
}

export async function getBillingOverviewClient(
	userId: string,
): Promise<BillingOverviewClient> {
	const overview = await getBillingOverview(userId);
	return toBillingOverviewClient(overview);
}
