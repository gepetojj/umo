import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import {
	workspaceMembersTable,
	workspacesTable,
} from "@/server/db/schema/workspaces";

/** Garante workspace + linha de owner para o usuário pagante Gold. */
export async function ensureWorkspaceWithOwnerMember(
	ownerUserId: string,
): Promise<{ id: string }> {
	const [existing] = await db
		.select({ id: workspacesTable.id })
		.from(workspacesTable)
		.where(eq(workspacesTable.ownerUserId, ownerUserId))
		.limit(1);
	if (existing) return existing;

	const id = randomUUID();
	await db.insert(workspacesTable).values({
		id,
		ownerUserId,
		name: null,
	});

	await db.insert(workspaceMembersTable).values({
		id: randomUUID(),
		workspaceId: id,
		userId: ownerUserId,
		role: "owner",
	});

	return { id };
}
