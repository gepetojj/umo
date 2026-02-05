"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { createMeeting } from "@/server/actions/meetings/create-meeting";
import { getMeetings } from "@/server/actions/meetings/get-meetings";
import { updateMeetingTitle } from "@/server/actions/meetings/update-meeting-title";

export const meetingsQueryKey = ["meetings"] as const;

export function useMeetings() {
	const queryClient = useQueryClient();

	const {
		data: meetings = [],
		isLoading: loading,
		refetch: refresh,
	} = useQuery({
		queryKey: meetingsQueryKey,
		queryFn: getMeetings,
	});

	const addMeeting = async (title: string) => {
		const { id } = await createMeeting(title);
		await queryClient.invalidateQueries({ queryKey: meetingsQueryKey });
		return id;
	};

	const updateTitle = async (meetingId: string, title: string) => {
		await updateMeetingTitle(meetingId, title);
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
