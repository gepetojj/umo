"use server";

import { and, desc, eq } from "drizzle-orm";

import { requireWorkspaceOwner } from "@/lib/workspace/guards";
import { authActionClient } from "@/server/actions/safe-action";
import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";
import { usersTable } from "@/server/db/schema/users";
import { workspaceMembersTable } from "@/server/db/schema/workspaces";

export const getWorkspaceMeetingsByMemberAction = authActionClient.action(
	async ({ ctx }) => {
		const wctx = await requireWorkspaceOwner(ctx.user.id);

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
			.where(eq(workspaceMembersTable.workspaceId, wctx.workspaceId));

		const byMember = await Promise.all(
			members.map(async (m) => {
				const meetings = await db
					.select({
						id: meetingsTable.id,
						title: meetingsTable.title,
						createdAt: meetingsTable.createdAt,
					})
					.from(meetingsTable)
					.where(
						and(
							eq(meetingsTable.workspaceId, wctx.workspaceId),
							eq(meetingsTable.creatorUserId, m.userId),
							eq(meetingsTable.visibility, "workspace"),
						),
					)
					.orderBy(desc(meetingsTable.createdAt));

				return {
					member: {
						userId: m.userId,
						fullName: m.fullName,
						email: m.email,
						role: m.role,
					},
					meetings: meetings.map((x) => ({
						id: x.id,
						title: x.title,
						createdAt: x.createdAt.getTime(),
					})),
				};
			}),
		);

		return { byMember };
	},
);
