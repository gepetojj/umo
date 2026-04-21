"use server";

import { randomUUID } from "node:crypto";

import { canUseTeamWorkspace } from "@/lib/entitlements";
import { resolveWorkspaceIdForNewMeeting } from "@/lib/workspace/resolve-workspace-for-meeting";
import { createMeetingSchema } from "@/server/actions/meetings/schemas/create-meeting.schema";
import { paidActionClient } from "@/server/actions/safe-action";
import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";

export const createMeetingAction = paidActionClient
	.inputSchema(createMeetingSchema)
	.action(async ({ ctx, parsedInput }) => {
		const id = randomUUID();

		const workspaceId = await resolveWorkspaceIdForNewMeeting(
			ctx.user.id,
			ctx.entitlements,
		);

		let visibility = parsedInput.visibility ?? "workspace";
		if (!workspaceId || !canUseTeamWorkspace(ctx.entitlements)) {
			visibility = "workspace";
		}

		await db.insert(meetingsTable).values({
			id,
			title: parsedInput.title,
			durationSeconds: 0,
			workspaceId,
			creatorUserId: ctx.user.id,
			visibility,
		});

		return { id };
	});
