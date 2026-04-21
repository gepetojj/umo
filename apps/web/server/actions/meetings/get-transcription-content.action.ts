"use server";

import { and, eq, isNull } from "drizzle-orm";

import { meetingIdSchema } from "@/server/actions/meetings/schemas/meeting-id.schema";
import { authActionClient } from "@/server/actions/safe-action";
import { db } from "@/server/db";
import { transcriptionsTable } from "@/server/db/schema/transcriptions";

export const getTranscriptionContentAction = authActionClient
	.inputSchema(meetingIdSchema)
	.action(async ({ parsedInput: { meetingId } }) => {
		const [row] = await db
			.select({
				content: transcriptionsTable.content,
				vtt: transcriptionsTable.vtt,
			})
			.from(transcriptionsTable)
			.where(
				and(
					eq(transcriptionsTable.meetingId, meetingId),
					isNull(transcriptionsTable.chunkIndex),
				),
			)
			.limit(1);

		return row?.vtt || row?.content || null;
	});
