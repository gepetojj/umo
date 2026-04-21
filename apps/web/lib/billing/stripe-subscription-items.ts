import type Stripe from "stripe";

import { env } from "@/server/env";

/** Item de preço base (Starter ou Gold), excluindo o add-on de vagas. */
export function findMainPlanSubscriptionItem(
	subscription: Stripe.Subscription,
): Stripe.SubscriptionItem | undefined {
	return subscription.items.data.find((item) => {
		const pid = item.price.id;
		return (
			pid === env.STRIPE_STARTER_PRICE_ID ||
			pid === env.STRIPE_GOLD_PRICE_ID
		);
	});
}

export function findSeatsSubscriptionItem(
	subscription: Stripe.Subscription,
): Stripe.SubscriptionItem | undefined {
	return subscription.items.data.find(
		(item) => item.price.id === env.STRIPE_SEATS_PRICE_ID,
	);
}
