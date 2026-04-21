"use server";

import { eq } from "drizzle-orm";

import { actionClient } from "@/server/actions/safe-action";
import { acceptInviteSchema } from "@/server/actions/workspace/schemas/accept-invite.schema";
import { db } from "@/server/db";
import { workspaceInvitationsTable } from "@/server/db/schema/workspaces";

function maskEmail(email: string): string {
	const [local, domain] = email.split("@");
	if (!domain || !local) return "•••";
	const masked =
		local.length <= 2
			? `${local[0] ?? ""}••`
			: `${local.slice(0, 2)}•••@${domain}`;
	return masked;
}

export const validateWorkspaceInviteAction = actionClient
	.inputSchema(acceptInviteSchema)
	.action(async ({ parsedInput }) => {
		const [inv] = await db
			.select()
			.from(workspaceInvitationsTable)
			.where(eq(workspaceInvitationsTable.token, parsedInput.token))
			.limit(1);

		if (!inv || inv.acceptedAt || inv.expiresAt < new Date()) {
			return { valid: false as const };
		}

		return {
			valid: true as const,
			emailHint: maskEmail(inv.email),
		};
	});
