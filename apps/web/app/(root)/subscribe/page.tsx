import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { SubscribePlans } from "@/components/billing/subscribe-plans";
import { getBillingOverviewClient } from "@/lib/subscriptions/billing-overview";
import { getUserFromClerk } from "@/lib/subscriptions/get-user-from-clerk";

export default async function SubscribePage() {
	const clerkUser = await currentUser();
	if (!clerkUser) redirect("/sign-in");

	const user = await getUserFromClerk(clerkUser.id);
	if (!user) redirect("/sign-in");

	const overview = await getBillingOverviewClient(user.id);

	return <SubscribePlans overview={overview} />;
}
