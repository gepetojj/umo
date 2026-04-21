"use server";

import { and, eq } from "drizzle-orm";

import { syncStripeSeatQuantityForWorkspace } from "@/lib/billing/sync-seat-billing";
import { deletePrivateMeetingsForUserInWorkspace } from "@/lib/workspace/delete-private-meetings-for-user";
import { requireWorkspaceOwner } from "@/lib/workspace/guards";
import { AuthError, authActionClient } from "@/server/actions/safe-action";
import { removeMemberSchema } from "@/server/actions/workspace/schemas/remove-member.schema";
import { db } from "@/server/db";
import { workspaceMembersTable } from "@/server/db/schema/workspaces";

export const removeWorkspaceMemberAction = authActionClient
	.inputSchema(removeMemberSchema)
	.action(async ({ ctx, parsedInput }) => {
		const wctx = await requireWorkspaceOwner(ctx.user.id);

		if (parsedInput.memberUserId === ctx.user.id) {
			throw new AuthError(
				"Para sair do workspace, use a opção Sair da equipe.",
			);
		}

		const [member] = await db
			.select()
			.from(workspaceMembersTable)
			.where(
				and(
					eq(workspaceMembersTable.workspaceId, wctx.workspaceId),
					eq(workspaceMembersTable.userId, parsedInput.memberUserId),
				),
			)
			.limit(1);

		if (!member) {
			throw new AuthError("Membro não encontrado.");
		}

		if (member.role === "owner") {
			throw new AuthError("Não é possível remover o titular.");
		}

		await deletePrivateMeetingsForUserInWorkspace(
			wctx.workspaceId,
			parsedInput.memberUserId,
		);

		await db
			.delete(workspaceMembersTable)
			.where(eq(workspaceMembersTable.id, member.id));

		await syncStripeSeatQuantityForWorkspace(wctx.workspaceId);

		return { ok: true as const };
	});
