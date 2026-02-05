"use server";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { db } from "@/server/db";
import { objectsTable } from "@/server/db/schema/objects";

const schema = z.object({
	meetingId: z.string(),
	key: z.string(),
	sizeBytes: z.number().min(0),
	contentType: z.string(),
});

export const registerUpload = async (data: z.infer<typeof schema>) => {
	const { meetingId, key, sizeBytes, contentType } = schema.parse(data);

	const object = await db
		.insert(objectsTable)
		.values({
			id: randomUUID(),
			meetingId,
			key,
			sizeBytes,
			contentType,
		})
		.returning();

	return object;
};
