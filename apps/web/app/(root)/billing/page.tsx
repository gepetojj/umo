import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { BillingOverviewPanel } from "@/components/billing/billing-overview-panel";
import { getBillingOverviewClient } from "@/lib/subscriptions/billing-overview";
import { getUserFromClerk } from "@/lib/subscriptions/get-user-from-clerk";

export default async function BillingPage() {
	const clerkUser = await currentUser();
	if (!clerkUser) redirect("/sign-in");

	const user = await getUserFromClerk(clerkUser.id);
	if (!user) redirect("/sign-in");

	const overview = await getBillingOverviewClient(user.id);

	return <BillingOverviewPanel overview={overview} />;
}
