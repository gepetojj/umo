"use server";

import { randomBytes, randomUUID } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { getAppBaseUrl } from "@/lib/app-base-url";
import { normalizeEmail } from "@/lib/normalize-email";
import { requireWorkspaceOwner } from "@/lib/workspace/guards";
import { AuthError, authActionClient } from "@/server/actions/safe-action";
import { inviteMemberSchema } from "@/server/actions/workspace/schemas/invite-member.schema";
import { db } from "@/server/db";
import { usersTable } from "@/server/db/schema/users";
import {
	workspaceInvitationsTable,
	workspaceMembersTable,
} from "@/server/db/schema/workspaces";

export const inviteWorkspaceMemberAction = authActionClient
	.inputSchema(inviteMemberSchema)
	.action(async ({ ctx, parsedInput }) => {
		const wctx = await requireWorkspaceOwner(ctx.user.id);
		const email = normalizeEmail(parsedInput.email);

		if (email === normalizeEmail(ctx.user.email)) {
			throw new AuthError("Você já é o titular deste workspace.");
		}

		const existingMembers = await db
			.select({ email: usersTable.email })
			.from(workspaceMembersTable)
			.innerJoin(
				usersTable,
				eq(workspaceMembersTable.userId, usersTable.id),
			)
			.where(eq(workspaceMembersTable.workspaceId, wctx.workspaceId));

		if (existingMembers.some((m) => normalizeEmail(m.email) === email)) {
			throw new AuthError("Este e-mail já faz parte do workspace.");
		}

		await db
			.delete(workspaceInvitationsTable)
			.where(
				and(
					eq(workspaceInvitationsTable.workspaceId, wctx.workspaceId),
					eq(workspaceInvitationsTable.email, email),
					isNull(workspaceInvitationsTable.acceptedAt),
				),
			);

		const token = randomBytes(24).toString("hex");
		const id = randomUUID();
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

		await db.insert(workspaceInvitationsTable).values({
			id,
			workspaceId: wctx.workspaceId,
			email,
			token,
			invitedByUserId: ctx.user.id,
			expiresAt,
			acceptedAt: null,
		});

		const joinUrl = `${getAppBaseUrl()}/workspace/join/${token}`;

		return { joinUrl };
	});
