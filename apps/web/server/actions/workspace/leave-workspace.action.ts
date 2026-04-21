"use server";

import { and, eq } from "drizzle-orm";

import { syncStripeSeatQuantityForWorkspace } from "@/lib/billing/sync-seat-billing";
import { deletePrivateMeetingsForUserInWorkspace } from "@/lib/workspace/delete-private-meetings-for-user";
import { requireWorkspaceMember } from "@/lib/workspace/guards";
import { AuthError, authActionClient } from "@/server/actions/safe-action";
import { db } from "@/server/db";
import { workspaceMembersTable } from "@/server/db/schema/workspaces";

export const leaveWorkspaceAction = authActionClient.action(async ({ ctx }) => {
	const wctx = await requireWorkspaceMember(ctx.user.id);

	if (wctx.role === "owner") {
		throw new AuthError(
			"O titular não pode sair do workspace por aqui. Entre em contato com o suporte se precisar encerrar o plano.",
		);
	}

	await deletePrivateMeetingsForUserInWorkspace(
		wctx.workspaceId,
		ctx.user.id,
	);

	await db
		.delete(workspaceMembersTable)
		.where(
			and(
				eq(workspaceMembersTable.workspaceId, wctx.workspaceId),
				eq(workspaceMembersTable.userId, ctx.user.id),
			),
		);

	await syncStripeSeatQuantityForWorkspace(wctx.workspaceId);

	return { ok: true as const };
});
