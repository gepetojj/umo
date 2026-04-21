import {
	getEntitlementsForPlan,
	type PlanEntitlements,
} from "@/lib/entitlements";

import { getActiveSubscription } from "./get-active-subscription";

/**
 * Entitlements do plano atualmente ativo para o usuário.
 * Use em server actions ao decidir acesso (workspace, export, etc.).
 */
export async function getActiveEntitlementsForUser(
	userId: string,
): Promise<PlanEntitlements | null> {
	const sub = await getActiveSubscription(userId);
	if (!sub) return null;
	if (sub.plan !== "starter" && sub.plan !== "gold") return null;
	return getEntitlementsForPlan(sub.plan);
}
