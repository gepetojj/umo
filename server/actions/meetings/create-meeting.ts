"use server";

import { randomUUID } from "node:crypto";

import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";

export const createMeeting = async (title: string) => {
	const id = randomUUID();
	await db.insert(meetingsTable).values({
		id,
		title,
		durationSeconds: 0,
	});
	return { id };
};
