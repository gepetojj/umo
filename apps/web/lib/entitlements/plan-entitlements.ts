import type { PlanId } from "@/lib/plans";

/**
 * Single source of truth for plan capabilities. Use these flags in server actions
 * and API routes when gating features (Meet, PDFs, workspace, etc.).
 */
export type PdfGenerationTier = "none" | "unlimited";

export type PlanEntitlements = {
	planId: PlanId;
	/** Starter: só a conta logada. Gold: workspace compartilhado. */
	collaboration: "individual" | "workspace";
	/** Workspace multiusuário (convites, compartilhamento). */
	teamWorkspace: boolean;
	/** Vagas incluídas no preço base do Gold (0 = sem workspace). */
	includedWorkspaceSeats: number;
	/**
	 * Preço por vaga extra (BRL), exibido e para futura cobrança adicional.
	 * Starter não aplica.
	 */
	extraWorkspaceSeatPriceBrl: number;
	/** Exportação WebVTT / transcrição — ambos os planos. */
	exportTranscriptionWebVtt: true;
	/** Integração Google Meet — aplicar quando a feature existir. */
	googleMeetIntegration: boolean;
	/** Geração de PDFs (resumos, questionários, atas) — aplicar quando existir. */
	pdfGeneration: PdfGenerationTier;
};

/** Vagas incluídas no Gold antes de cobrar extra. */
export const GOLD_INCLUDED_WORKSPACE_SEATS = 5;

/** Valor por vaga extra (BRL), conforme regra de negócio atual. */
export const GOLD_EXTRA_SEAT_PRICE_BRL = 50;

export function getEntitlementsForPlan(planId: PlanId): PlanEntitlements {
	switch (planId) {
		case "starter":
			return {
				planId: "starter",
				collaboration: "individual",
				teamWorkspace: false,
				includedWorkspaceSeats: 0,
				extraWorkspaceSeatPriceBrl: 0,
				exportTranscriptionWebVtt: true,
				googleMeetIntegration: false,
				pdfGeneration: "none",
			};
		case "gold":
			return {
				planId: "gold",
				collaboration: "workspace",
				teamWorkspace: true,
				includedWorkspaceSeats: GOLD_INCLUDED_WORKSPACE_SEATS,
				extraWorkspaceSeatPriceBrl: GOLD_EXTRA_SEAT_PRICE_BRL,
				exportTranscriptionWebVtt: true,
				googleMeetIntegration: true,
				pdfGeneration: "unlimited",
			};
		default: {
			const _exhaustive: never = planId;
			return _exhaustive;
		}
	}
}

/** Uso futuro: obter entitlements a partir da assinatura ativa no banco. */
export function entitlementsFromSubscriptionPlan(
	plan: string | null | undefined,
): PlanEntitlements | null {
	if (plan === "starter" || plan === "gold") {
		return getEntitlementsForPlan(plan);
	}
	return null;
}

export function canUseTeamWorkspace(e: PlanEntitlements): boolean {
	return e.teamWorkspace && e.collaboration === "workspace";
}

export function canUseGoogleMeetIntegration(e: PlanEntitlements): boolean {
	return e.googleMeetIntegration;
}

export function canGeneratePdfDocuments(e: PlanEntitlements): boolean {
	return e.pdfGeneration === "unlimited";
}
