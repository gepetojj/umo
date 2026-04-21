import type { meetingsTable } from "@/server/db/schema/meetings";

import { getWorkspaceContextForUser } from "./workspace-context";

type MeetingRow = typeof meetingsTable.$inferSelect;

export async function userCanAccessMeeting(
	userId: string,
	meeting: MeetingRow,
): Promise<boolean> {
	if (!meeting.workspaceId) {
		return meeting.creatorUserId === userId;
	}

	const ctx = await getWorkspaceContextForUser(userId);
	if (!ctx || ctx.workspaceId !== meeting.workspaceId) {
		return false;
	}

	if (meeting.visibility === "private") {
		return meeting.creatorUserId === userId;
	}

	return true;
}
