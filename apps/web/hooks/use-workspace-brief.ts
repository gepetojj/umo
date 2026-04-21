"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { unwrapSafeActionResult } from "@/lib/unwrap-safe-action-result";
import { getWorkspaceBriefAction } from "@/server/actions/workspace/get-workspace-brief.action";

export const workspaceBriefQueryKey = ["workspace-brief"] as const;

export function useWorkspaceBrief() {
	const { isSignedIn } = useAuth();
	return useQuery({
		queryKey: workspaceBriefQueryKey,
		enabled: isSignedIn,
		queryFn: async () =>
			unwrapSafeActionResult(await getWorkspaceBriefAction()),
	});
}
