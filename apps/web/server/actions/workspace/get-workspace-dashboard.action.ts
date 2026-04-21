"use server";

import { and, desc, eq, gt, isNull } from "drizzle-orm";

import { getWorkspaceContextForUser } from "@/lib/workspace/workspace-context";
import { authActionClient } from "@/server/actions/safe-action";
import { db } from "@/server/db";
import { usersTable } from "@/server/db/schema/users";
import {
	workspaceInvitationsTable,
	workspaceMembersTable,
} from "@/server/db/schema/workspaces";

export const getWorkspaceDashboardAction = authActionClient.action(
	async ({ ctx }) => {
		const wctx = await getWorkspaceContextForUser(ctx.user.id);
		if (!wctx) return null;

		const members = await db
			.select({
				userId: usersTable.id,
				email: usersTable.email,
				fullName: usersTable.fullName,
				role: workspaceMembersTable.role,
			})
			.from(workspaceMembersTable)
			.innerJoin(
				usersTable,
				eq(workspaceMembersTable.userId, usersTable.id),
			)
			.where(eq(workspaceMembersTable.workspaceId, wctx.workspaceId))
			.orderBy(desc(workspaceMembersTable.createdAt));

		if (wctx.role !== "owner") {
			return {
				role: "member" as const,
				workspaceId: wctx.workspaceId,
				members,
			};
		}

		const now = new Date();
		const invitations = await db
			.select({
				id: workspaceInvitationsTable.id,
				email: workspaceInvitationsTable.email,
				expiresAt: workspaceInvitationsTable.expiresAt,
			})
			.from(workspaceInvitationsTable)
			.where(
				and(
					eq(workspaceInvitationsTable.workspaceId, wctx.workspaceId),
					isNull(workspaceInvitationsTable.acceptedAt),
					gt(workspaceInvitationsTable.expiresAt, now),
				),
			)
			.orderBy(desc(workspaceInvitationsTable.createdAt));

		return {
			role: "owner" as const,
			workspaceId: wctx.workspaceId,
			members,
			invitations: invitations.map((i) => ({
				id: i.id,
				email: i.email,
				expiresAt: i.expiresAt.getTime(),
			})),
		};
	},
);
