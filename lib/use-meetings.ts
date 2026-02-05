"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { MeetingRecord } from "@/lib/db";
import {
	addMeeting as dbAddMeeting,
	updateMeetingTitle as dbUpdateMeetingTitle,
	getMeetings,
} from "@/lib/db";

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

	const addMeeting = async (
		meeting: Omit<MeetingRecord, "durationSeconds"> & {
			durationSeconds?: number;
		},
	) => {
		await dbAddMeeting(meeting);
		await queryClient.invalidateQueries({ queryKey: meetingsQueryKey });
	};

	const updateMeetingTitle = async (id: string, title: string) => {
		await dbUpdateMeetingTitle(id, title);
		await queryClient.invalidateQueries({ queryKey: meetingsQueryKey });
	};

	return {
		meetings,
		loading,
		refresh,
		addMeeting,
		updateMeetingTitle,
	};
}
