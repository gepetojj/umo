"use server";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";

export const updateMeetingTitle = async (meetingId: string, title: string) => {
	await db
		.update(meetingsTable)
		.set({ title, updatedAt: new Date() })
		.where(eq(meetingsTable.id, meetingId));
};
