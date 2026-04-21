import type { PlanEntitlements } from "@/lib/entitlements";
import { canUseTeamWorkspace } from "@/lib/entitlements";
import { getActiveSubscription } from "@/lib/subscriptions/get-active-subscription";

import { ensureWorkspaceWithOwnerMember } from "./ensure-workspace";
import { getWorkspaceContextForUser } from "./workspace-context";

/**
 * Workspace da reunião para usuários Gold (dono ou membro). Starter → null.
 */
export async function resolveWorkspaceIdForNewMeeting(
	userId: string,
	entitlements: PlanEntitlements,
): Promise<string | null> {
	if (!canUseTeamWorkspace(entitlements)) return null;

	const ctx = await getWorkspaceContextForUser(userId);
	if (ctx) return ctx.workspaceId;

	const sub = await getActiveSubscription(userId);
	if (sub?.plan === "gold" && sub.userId === userId) {
		const w = await ensureWorkspaceWithOwnerMember(userId);
		return w.id;
	}

	return null;
}
