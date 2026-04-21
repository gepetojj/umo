"use server";

import { getBillingOverview } from "@/lib/subscriptions/billing-overview";
import { authActionClient } from "@/server/actions/safe-action";

/** Snapshot for client components after mutations (e.g. router.refresh companion). */
export const getBillingOverviewAction = authActionClient.action(
	async ({ ctx }) => {
		return getBillingOverview(ctx.user.id);
	},
);
