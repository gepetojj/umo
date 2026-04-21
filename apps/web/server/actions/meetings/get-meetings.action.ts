"use server";

import { desc } from "drizzle-orm";

import { authActionClient } from "@/server/actions/safe-action";
import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";

export const getMeetingsAction = authActionClient.action(async () => {
	const rows = await db
		.select()
		.from(meetingsTable)
		.orderBy(desc(meetingsTable.createdAt));
	return rows.map((m) => ({
		id: m.id,
		title: m.title,
		durationSeconds: m.durationSeconds,
		createdAt: m.createdAt.getTime(),
	}));
});
