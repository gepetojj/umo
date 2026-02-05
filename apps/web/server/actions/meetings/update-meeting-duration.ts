"use server";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";

export const updateMeetingDuration = async (
	meetingId: string,
	durationSeconds: number,
) => {
	await db
		.update(meetingsTable)
		.set({ durationSeconds, updatedAt: new Date() })
		.where(eq(meetingsTable.id, meetingId));
};
