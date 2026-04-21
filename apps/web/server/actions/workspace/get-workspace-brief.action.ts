"use server";

import { getWorkspaceContextForUser } from "@/lib/workspace/workspace-context";
import { authActionClient } from "@/server/actions/safe-action";

export const getWorkspaceBriefAction = authActionClient.action(
	async ({ ctx }) => {
		const wctx = await getWorkspaceContextForUser(ctx.user.id);
		return {
			inWorkspace: Boolean(wctx),
			isOwner: wctx?.role === "owner",
			canTogglePrivateMeeting: Boolean(wctx),
		};
	},
);
