import { and, eq } from "drizzle-orm";

import { db } from "@/server/db";
import {
	workspaceMembersTable,
	workspacesTable,
} from "@/server/db/schema/workspaces";

export type WorkspaceContext = {
	workspaceId: string;
	role: "owner" | "member";
	ownerUserId: string;
};

export async function getWorkspaceContextForUser(
	userId: string,
): Promise<WorkspaceContext | null> {
	const [row] = await db
		.select({
			workspaceId: workspaceMembersTable.workspaceId,
			role: workspaceMembersTable.role,
			ownerUserId: workspacesTable.ownerUserId,
		})
		.from(workspaceMembersTable)
		.innerJoin(
			workspacesTable,
			eq(workspaceMembersTable.workspaceId, workspacesTable.id),
		)
		.where(eq(workspaceMembersTable.userId, userId))
		.limit(1);

	if (!row) return null;
	if (row.role !== "owner" && row.role !== "member") return null;

	return {
		workspaceId: row.workspaceId,
		role: row.role,
		ownerUserId: row.ownerUserId,
	};
}

export async function isWorkspaceOwner(
	userId: string,
	workspaceId: string,
): Promise<boolean> {
	const [m] = await db
		.select({ id: workspaceMembersTable.id })
		.from(workspaceMembersTable)
		.where(
			and(
				eq(workspaceMembersTable.workspaceId, workspaceId),
				eq(workspaceMembersTable.userId, userId),
				eq(workspaceMembersTable.role, "owner"),
			),
		)
		.limit(1);
	return Boolean(m);
}
