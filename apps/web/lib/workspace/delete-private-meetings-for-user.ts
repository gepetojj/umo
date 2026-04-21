import { and, eq } from "drizzle-orm";

import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";

export async function deletePrivateMeetingsForUserInWorkspace(
	workspaceId: string,
	userId: string,
) {
	await db
		.delete(meetingsTable)
		.where(
			and(
				eq(meetingsTable.workspaceId, workspaceId),
				eq(meetingsTable.creatorUserId, userId),
				eq(meetingsTable.visibility, "private"),
			),
		);
}
