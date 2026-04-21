"use server";

import { getPriceIdForPlan } from "@/lib/plans";
import { getActiveSubscription } from "@/lib/subscriptions/get-active-subscription";
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
		);
		const itemId = stripeSub.items.data[0]?.id;
		if (!itemId) {
			throw new Error(
				"Não foi possível concluir a troca agora. Tente de novo em instantes.",
			);
		}

		await stripe.subscriptions.update(active.stripeSubscriptionId, {
			items: [
				{
					id: itemId,
					price: getPriceIdForPlan(parsedInput.planId),
				},
			],
			proration_behavior: "create_prorations",
		});

		return { ok: true as const };
	});
