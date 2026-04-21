"use server";

import type Stripe from "stripe";

import {
	findMainPlanSubscriptionItem,
	findSeatsSubscriptionItem,
} from "@/lib/billing/stripe-subscription-items";
import { getPriceIdForPlan } from "@/lib/plans";
import { getActiveSubscription } from "@/lib/subscriptions/get-active-subscription";
import { syncSubscriptionFromStripe } from "@/lib/subscriptions/sync-subscription-from-stripe";
import { AuthError, authActionClient } from "@/server/actions/safe-action";
import { stripe } from "@/server/stripe";

import { changeSubscriptionPlanSchema } from "./schemas/change-subscription-plan.schema";

export const changeSubscriptionPlanAction = authActionClient
	.inputSchema(changeSubscriptionPlanSchema)
	.action(async ({ ctx, parsedInput }) => {
		const active = await getActiveSubscription(ctx.user.id);
		if (!active) {
			throw new AuthError(
				"Não há assinatura ativa. Escolha um plano para começar.",
			);
		}

		if (active.plan === parsedInput.planId) {
			throw new AuthError("Este já é o seu plano atual.");
		}

		const stripeSub = await stripe.subscriptions.retrieve(
			active.stripeSubscriptionId,
			{ expand: ["items.data.price"] },
		);

		const mainItem = findMainPlanSubscriptionItem(stripeSub);
		if (!mainItem) {
			throw new Error(
				"Não foi possível localizar o item de plano na assinatura. Contate o suporte.",
			);
		}

		const seatsItem = findSeatsSubscriptionItem(stripeSub);
		const newPriceId = getPriceIdForPlan(parsedInput.planId);

		const items: Stripe.SubscriptionUpdateParams.Item[] = [
			{ id: mainItem.id, price: newPriceId },
		];

		// Starter não cobra vagas: remove o add-on para não continuar faturando extras.
		if (parsedInput.planId === "starter" && seatsItem) {
			items.push({ id: seatsItem.id, deleted: true });
		}

		await stripe.subscriptions.update(active.stripeSubscriptionId, {
			items,
			proration_behavior: "create_prorations",
		});

		const updated = await stripe.subscriptions.retrieve(
			active.stripeSubscriptionId,
			{ expand: ["items.data.price"] },
		);
		await syncSubscriptionFromStripe(updated);

		return { ok: true as const };
	});
