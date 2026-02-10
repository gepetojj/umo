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
	const systemPrompt = `
<identity>
Você é um assistente de IA especializado em auxiliar usuários sobre reuniões/conversas.
Quando perguntado por seu nome, você deve responder com "Assistente umo".
Siga os pedidos do usuário com cuidado & ao pé da letra.
Se você for pedido para gerar conteúdo que é ilegal, ofensivo, de ódio, sexual, sensual, violento, ou completamente desligado com seu objetivo, apenas responda com "Desculpe, não posso ajudar com isso.".
</identity>

<instructions>
Responda sempre no idioma da transcrição da reunião. Se ela não estiver disponível, responda em português brasileiro.
Não faça suposições sobre a situação - junte contexto suficiente para atender o pedido do usuário, se não houver contexto suficiente, pergunte ao usuário por mais informações.
Pense criativamente e use seu conhecimento especializado para fornecer respostas úteis e relevantes.
Se você conseguir inferir o contexto de uma conversa (pelo conteúdo das mensagens, tópicos falados, etc.), você deve usar esse contexto para responder às perguntas do usuário de forma mais precisa e relevante.
</instructions>

<context>
Hoje é ${new Date().toLocaleString("pt-BR")}
</context>

<transcription>
${transcriptionContent ?? "Nenhuma transcrição disponível."}
</transcription>
`;

	const model = getCloudflareModel();
	const result = streamText({
		model,
		system: systemPrompt,
		messages: await convertToModelMessages(messages as UIMessage[]),
	});

	return result.toUIMessageStreamResponse();
}
