"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { syncStripeSeatQuantityForWorkspace } from "@/lib/billing/sync-seat-billing";
import { normalizeEmail } from "@/lib/normalize-email";
import { getWorkspaceContextForUser } from "@/lib/workspace/workspace-context";
import { AuthError, authActionClient } from "@/server/actions/safe-action";
import { acceptInviteSchema } from "@/server/actions/workspace/schemas/accept-invite.schema";
import { db } from "@/server/db";
import {
	workspaceInvitationsTable,
	workspaceMembersTable,
} from "@/server/db/schema/workspaces";

export const acceptWorkspaceInviteAction = authActionClient
	.inputSchema(acceptInviteSchema)
	.action(async ({ ctx, parsedInput }) => {
		const [inv] = await db
			.select()
			.from(workspaceInvitationsTable)
			.where(eq(workspaceInvitationsTable.token, parsedInput.token))
			.limit(1);

		if (!inv) {
			throw new AuthError("Convite inválido.");
		}
		if (inv.acceptedAt) {
			throw new AuthError("Este convite já foi utilizado.");
		}
		if (inv.expiresAt < new Date()) {
			throw new AuthError("Este convite expirou.");
		}

		const email = normalizeEmail(ctx.user.email);
		if (normalizeEmail(inv.email) !== email) {
			throw new AuthError(
				"Entre na conta cujo e-mail recebeu o convite.",
			);
		}

		const existing = await getWorkspaceContextForUser(ctx.user.id);
		if (existing) {
			if (existing.workspaceId === inv.workspaceId) {
				throw new AuthError("Você já faz parte deste workspace.");
			}
			throw new AuthError(
				"Sua conta já está vinculada a outro workspace.",
			);
		}

		await db.insert(workspaceMembersTable).values({
			id: randomUUID(),
			workspaceId: inv.workspaceId,
			userId: ctx.user.id,
			role: "member",
		});

		await db
			.update(workspaceInvitationsTable)
			.set({ acceptedAt: new Date() })
			.where(eq(workspaceInvitationsTable.id, inv.id));

		await syncStripeSeatQuantityForWorkspace(inv.workspaceId);

		return { ok: true as const };
	});
