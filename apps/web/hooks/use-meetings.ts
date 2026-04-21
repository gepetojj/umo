"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { unwrapSafeActionResult } from "@/lib/unwrap-safe-action-result";
import { createMeetingAction } from "@/server/actions/meetings/create-meeting.action";
import { getMeetingsAction } from "@/server/actions/meetings/get-meetings.action";
import { updateMeetingTitleAction } from "@/server/actions/meetings/update-meeting-title.action";

export const meetingsQueryKey = ["meetings"] as const;

export function useMeetings() {
	const queryClient = useQueryClient();

	const {
		data: meetings = [],
		isLoading: loading,
		refetch: refresh,
	} = useQuery({
		queryKey: meetingsQueryKey,
		queryFn: async () => unwrapSafeActionResult(await getMeetingsAction()),
	});

	const addMeeting = async (
		title: string,
		visibility?: "workspace" | "private",
	) => {
		const { id } = unwrapSafeActionResult(
			await createMeetingAction(
				visibility ? { title, visibility } : { title },
			),
		);
		await queryClient.invalidateQueries({ queryKey: meetingsQueryKey });
		return id;
	};

	const updateTitle = async (meetingId: string, title: string) => {
		unwrapSafeActionResult(
			await updateMeetingTitleAction({ meetingId, title }),
		);
		await queryClient.invalidateQueries({ queryKey: meetingsQueryKey });
	};

	return {
		meetings,
		loading,
		refresh,
		addMeeting,
		updateTitle,
	};
}
