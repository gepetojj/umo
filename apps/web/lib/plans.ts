import { env } from "@/server/env";

export const PLAN_IDS = ["starter", "gold"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type PlanDefinition = {
	id: PlanId;
	name: string;
	tagline: string;
	/** Fallback quando o preço ainda não foi carregado da Stripe. */
	priceLabel: string;
	/** Display order / upgrade rank — higher means more capable. */
	tier: number;
	features: string[];
	highlighted?: boolean;
};

const starterFeatures = [
	"Uso individual — só a sua conta, sem workspace de equipe",
	"Transcrição e resumos com IA",
	"Histórico das suas reuniões",
	"Exportação da transcrição (WebVTT)",
];

const goldFeatures = [
	"Workspace de equipe por convite — até 5 pessoas inclusas; depois, R$ 50 por vaga extra",
	"Transcrição e resumos com IA",
	"Histórico compartilhado no workspace",
	"Exportação da transcrição (WebVTT)",
	"Prioridade no processamento e suporte dedicado",
];

export function getPlanDefinitions(): PlanDefinition[] {
	return [
		{
			id: "starter",
			name: "Starter",
			tagline:
				"Para quem trabalha sozinho e quer cada reunião registrada com clareza.",
			priceLabel: "Cobrança mensal",
			tier: 1,
			features: starterFeatures,
		},
		{
			id: "gold",
			name: "Gold",
			tagline:
				"Para equipes que precisam de um espaço único, convites e prioridade.",
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
