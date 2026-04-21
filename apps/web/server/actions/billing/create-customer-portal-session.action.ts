"use server";

import { getAppBaseUrl } from "@/lib/app-base-url";
import { ensureStripeCustomer } from "@/lib/subscriptions/ensure-stripe-customer";
import { authActionClient } from "@/server/actions/safe-action";
import { stripe } from "@/server/stripe";

export const createCustomerPortalSessionAction = authActionClient.action(
	async ({ ctx }) => {
		const customerId = await ensureStripeCustomer(ctx.user);
		const base = getAppBaseUrl();

		const session = await stripe.billingPortal.sessions.create({
			customer: customerId,
			return_url: `${base}/billing`,
		});

		if (!session.url) {
			throw new Error(
				"Não foi possível abrir a área de pagamentos. Tente de novo.",
			);
		}

		return { url: session.url };
	},
);
