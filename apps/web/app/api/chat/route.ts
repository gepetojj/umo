import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

import { getTranscriptionContent } from "@/server/actions/meetings/get-transcription-content";
import { getCloudflareModel } from "@/server/ai/cloudflare-provider";
import { db } from "@/server/db";
import { meetingMessagesTable } from "@/server/db/schema/meeting-messages";

const bodySchema = z.object({
	meetingId: z.string().uuid(),
	messages: z.array(
		z.object({
			id: z.string(),
			role: z.enum(["user", "assistant", "system"]),
			parts: z.array(z.unknown()),
		}),
	),
});

export const maxDuration = 60;

export async function POST(req: NextRequest) {
	let body: z.infer<typeof bodySchema>;
	try {
		body = bodySchema.parse(await req.json());
	} catch {
		return new Response("Invalid body", { status: 400 });
	}

	const { meetingId, messages } = body;
	if (messages.length === 0) {
		return new Response("Messages required", { status: 400 });
	}

	const lastMessage = messages[messages.length - 1] as UIMessage;
	if (lastMessage.role === "user") {
		const [existing] = await db
			.select({ id: meetingMessagesTable.id })
			.from(meetingMessagesTable)
			.where(eq(meetingMessagesTable.id, lastMessage.id))
			.limit(1);
		if (!existing) {
			await db.insert(meetingMessagesTable).values({
				id: lastMessage.id,
				meetingId,
				role: lastMessage.role,
				parts: Array.isArray(lastMessage.parts)
					? lastMessage.parts
					: [],
			});
		}
	}

	const transcriptionContent = await getTranscriptionContent(meetingId);
	const systemPrompt = transcriptionContent?.trim()
		? `Contexto da reunião (transcrição) para responder perguntas do usuário. Use apenas esta transcrição para fundamentar suas respostas.

<transcrição>
${transcriptionContent.slice(0, 25_000)}
</transcrição>

Responda em português, de forma clara e objetiva, com base apenas no que foi discutido na reunião.`
		: undefined;

	const model = getCloudflareModel();
	const result = streamText({
		model,
		system: systemPrompt,
		messages: await convertToModelMessages(messages as UIMessage[]),
	});

	return result.toUIMessageStreamResponse();
}
