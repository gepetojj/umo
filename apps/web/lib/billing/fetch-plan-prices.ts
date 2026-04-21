import type { PlanId } from "@/lib/plans";
import { env } from "@/server/env";
import { stripe } from "@/server/stripe";

export type PlanPriceDisplay = {
	/** Ex.: "R$ 49,00" */
	formattedAmount: string;
	/** Ex.: "por mês" */
	billingCadence: string;
};

function formatStripePrice(price: {
	unit_amount: number | null;
	currency: string;
	recurring?: { interval: string } | null;
}): PlanPriceDisplay {
	const amount = price.unit_amount ?? 0;
	const currency = price.currency.toUpperCase();
	const formattedAmount = new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency,
	}).format(amount / 100);

	const interval = price.recurring?.interval;
	let billingCadence = "por período";
	if (interval === "month") billingCadence = "por mês";
	else if (interval === "year") billingCadence = "por ano";

	return { formattedAmount, billingCadence };
}

/** Lê preços na Stripe para exibir na página de planos (valor exibido = fonte da verdade do preço). */
export async function fetchPlanPriceDisplays(): Promise<
	Partial<Record<PlanId, PlanPriceDisplay>>
> {
	try {
		const [starterPrice, goldPrice] = await Promise.all([
			stripe.prices.retrieve(env.STRIPE_STARTER_PRICE_ID),
			stripe.prices.retrieve(env.STRIPE_GOLD_PRICE_ID),
		]);

		return {
			starter: formatStripePrice(starterPrice),
			gold: formatStripePrice(goldPrice),
		};
	} catch (err) {
		console.error("[billing] fetchPlanPriceDisplays:", err);
		return {};
	}
}
