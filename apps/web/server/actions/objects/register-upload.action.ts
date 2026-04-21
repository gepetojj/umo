"use server";

import { randomUUID } from "node:crypto";

import { registerUploadSchema } from "@/server/actions/objects/schemas/register-upload.schema";
import { authActionClient } from "@/server/actions/safe-action";
import { db } from "@/server/db";
import { objectsTable } from "@/server/db/schema/objects";

export const registerUploadAction = authActionClient
	.inputSchema(registerUploadSchema)
	.action(async ({ parsedInput }) => {
		const object = await db
			.insert(objectsTable)
			.values({
				id: randomUUID(),
				meetingId: parsedInput.meetingId,
				key: parsedInput.key,
				sizeBytes: parsedInput.sizeBytes,
				contentType: parsedInput.contentType,
			})
			.returning();

		return object;
	});
