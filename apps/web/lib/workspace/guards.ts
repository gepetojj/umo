import { AuthError } from "@/server/actions/safe-action";

import { getWorkspaceContextForUser } from "./workspace-context";

export async function requireWorkspaceOwner(userId: string) {
	const ctx = await getWorkspaceContextForUser(userId);
	if (!ctx || ctx.role !== "owner") {
		throw new AuthError("Apenas o titular do workspace pode fazer isso.");
	}
	return ctx;
}

export async function requireWorkspaceMember(userId: string) {
	const ctx = await getWorkspaceContextForUser(userId);
	if (!ctx) {
		throw new AuthError("Você não participa de um workspace.");
	}
	return ctx;
}
