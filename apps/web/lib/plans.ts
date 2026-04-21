import { env } from "@/server/env";

export const PLAN_IDS = ["starter", "gold"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type PlanDefinition = {
	id: PlanId;
	name: string;
	tagline: string;
	priceLabel: string;
	/** Display order / upgrade rank — higher means more capable. */
	tier: number;
	features: string[];
	highlighted?: boolean;
};

const starterFeatures = [
	"Transcrição e resumos com IA",
	"Histórico de reuniões",
	"Exportação do contexto da reunião",
];

const goldFeatures = [
	"Tudo do Starter",
	"Prioridade no processamento",
	"Suporte prioritário",
	"Mais folga para equipes que vivem de reuniões",
];

export function getPlanDefinitions(): PlanDefinition[] {
	return [
		{
			id: "starter",
			name: "Starter",
			tagline: "Para equipes que querem registrar e sintetizar reuniões.",
			priceLabel: "Cobrança mensal",
			tier: 1,
			features: starterFeatures,
		},
		{
			id: "gold",
			name: "Gold",
			tagline: "Para quem precisa de mais capacidade e prioridade.",
			priceLabel: "Cobrança mensal",
			tier: 2,
			features: goldFeatures,
			highlighted: true,
		},
	];
}

export function getPriceIdForPlan(planId: PlanId): string {
	switch (planId) {
		case "starter":
			return env.STRIPE_STARTER_PRICE_ID;
		case "gold":
			return env.STRIPE_GOLD_PRICE_ID;
		default: {
			const _exhaustive: never = planId;
			return _exhaustive;
		}
	}
}

export function getPlanIdFromPriceId(
	priceId: string | undefined,
): PlanId | null {
	if (!priceId) return null;
	if (priceId === env.STRIPE_STARTER_PRICE_ID) return "starter";
	if (priceId === env.STRIPE_GOLD_PRICE_ID) return "gold";
	return null;
}
