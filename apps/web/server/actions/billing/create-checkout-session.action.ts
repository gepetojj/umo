"use server";

import { getAppBaseUrl } from "@/lib/app-base-url";
import { getPriceIdForPlan } from "@/lib/plans";
import { ensureStripeCustomer } from "@/lib/subscriptions/ensure-stripe-customer";
import { getActiveSubscription } from "@/lib/subscriptions/get-active-subscription";
import { AuthError, authActionClient } from "@/server/actions/safe-action";
import { stripe } from "@/server/stripe";

import { createCheckoutSessionSchema } from "./schemas/create-checkout-session.schema";

export const createCheckoutSessionAction = authActionClient
	.inputSchema(createCheckoutSessionSchema)
	.action(async ({ ctx, parsedInput }) => {
		const existing = await getActiveSubscription(ctx.user.id);
		if (existing) {
			throw new AuthError(
				"Você já tem uma assinatura ativa. Para mudar de plano, use a página de planos ou Minha assinatura.",
			);
		}

		const customerId = await ensureStripeCustomer(ctx.user);
		const base = getAppBaseUrl();

		const session = await stripe.checkout.sessions.create({
			customer: customerId,
			mode: "subscription",
			line_items: [
				{ price: getPriceIdForPlan(parsedInput.planId), quantity: 1 },
			],
			success_url: `${base}/subscribe/success`,
			cancel_url: `${base}/subscribe`,
			allow_promotion_codes: true,
			client_reference_id: ctx.user.id,
			subscription_data: {
				metadata: { userId: ctx.user.id },
			},
			metadata: { userId: ctx.user.id },
		});

		if (!session.url) {
			throw new Error(
				"Não foi possível abrir o pagamento. Tente de novo.",
			);
		}

		return { url: session.url };
	});
