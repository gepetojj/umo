import { randomUUID, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/server/db";
import { meetingsTable } from "@/server/db/schema/meetings";
import { transcriptionsTable } from "@/server/db/schema/transcriptions";
import { env } from "@/server/env";

const schema = z.object({
	meetingId: z.string(),
	content: z.string(),
	vtt: z.string().optional(),
	title: z.string().optional(),
});

export const POST = async (req: NextRequest) => {
	const { meetingId, content, vtt, title } = schema.parse(await req.json());

	const apiKey = req.headers.get("Authorization");
	if (!apiKey) {
		return new Response("Unauthorized", { status: 401 });
	}
	const expectedApiKey = env.TRANSCRIPTIONS_API_KEY;
	if (apiKey.length !== expectedApiKey.length) {
		return new Response("Unauthorized", { status: 401 });
	}
	if (!timingSafeEqual(Buffer.from(apiKey), Buffer.from(expectedApiKey))) {
		return new Response("Unauthorized", { status: 401 });
	}

	await db.transaction(async (trx) => {
		await trx.insert(transcriptionsTable).values({
			id: randomUUID(),
			meetingId,
			content,
			vtt,
		});
		if (title) {
			await trx
				.update(meetingsTable)
				.set({
					title,
				})
				.where(eq(meetingsTable.id, meetingId));
		}
	});

	return new Response(null, { status: 200 });
};
