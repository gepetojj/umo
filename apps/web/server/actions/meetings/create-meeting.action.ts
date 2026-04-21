"use server";

import { randomUUID } from "node:crypto";

import { createMeetingSchema } from "@/server/actions/meetings/schemas/create-meeting.schema";
import { paidActionClient } from "@/server/actions/safe-action";
import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";

export const createMeetingAction = paidActionClient
	.inputSchema(createMeetingSchema)
	.action(async ({ parsedInput }) => {
		const id = randomUUID();
		await db.insert(meetingsTable).values({
			id,
			title: parsedInput.title,
			durationSeconds: 0,
		});
		return { id };
	});
