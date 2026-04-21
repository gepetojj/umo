"use server";

import { and, desc, eq, isNull, or } from "drizzle-orm";

import { getWorkspaceContextForUser } from "@/lib/workspace/workspace-context";
import { authActionClient } from "@/server/actions/safe-action";
import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";

export const getMeetingsAction = authActionClient.action(async ({ ctx }) => {
	const wsCtx = await getWorkspaceContextForUser(ctx.user.id);

	const rows = wsCtx
		? await db
				.select()
				.from(meetingsTable)
				.where(
					or(
						and(
							eq(meetingsTable.workspaceId, wsCtx.workspaceId),
							or(
								eq(meetingsTable.visibility, "workspace"),
								and(
									eq(meetingsTable.visibility, "private"),
									eq(
										meetingsTable.creatorUserId,
										ctx.user.id,
									),
								),
							),
						),
						and(
							eq(meetingsTable.creatorUserId, ctx.user.id),
							isNull(meetingsTable.workspaceId),
						),
					),
				)
				.orderBy(desc(meetingsTable.createdAt))
		: await db
				.select()
				.from(meetingsTable)
				.where(
					and(
						eq(meetingsTable.creatorUserId, ctx.user.id),
						isNull(meetingsTable.workspaceId),
					),
				)
				.orderBy(desc(meetingsTable.createdAt));

	return rows.map((m) => ({
		id: m.id,
		title: m.title,
		durationSeconds: m.durationSeconds,
		createdAt: m.createdAt.getTime(),
		visibility: m.visibility,
		isPrivate: m.visibility === "private",
	}));
});
