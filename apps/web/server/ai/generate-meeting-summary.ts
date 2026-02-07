import { randomUUID } from "node:crypto";

import { generateText } from "ai";
import { eq } from "drizzle-orm";

import { getCloudflareModel } from "@/server/ai/cloudflare-provider";
import { db } from "@/server/db";
import { meetingMessagesTable } from "@/server/db/schema/meeting-messages";

const SUMMARY_SYSTEM_PROMPT = `## Papel
Você é um assistente que analisa transcrições de reuniões e produz resumos estruturados em markdown.

## Tarefa
Com base na transcrição fornecida, produza uma única resposta em markdown com as seguintes seções (use exatamente estes títulos em português):

### Resumo
Um parágrafo objetivo com os principais pontos discutidos na reunião.

### Action items
Lista em bullet points com os itens de ação identificados (quem faz o quê, quando aplicável). Se não houver itens claros, escreva "Nenhum action item identificado."

### Tarefas
Lista em bullet points com tarefas concretas mencionadas (entregas, prazos, responsáveis). Se não houver, escreva "Nenhuma tarefa específica identificada."

### Análises gerais
Observações sobre tom, decisões, dúvidas pendentes ou temas recorrentes. Seja conciso.

## Regras
- Use o mesmo idioma da transcrição.
- Não invente informações que não estejam na transcrição.
- Saída apenas em markdown, sem texto antes ou depois das seções.`;

/**
 * Generates meeting summary (resumo, action items, análises) from transcription
 * and persists it as the first assistant message for the meeting chat.
 * Idempotent: if the meeting already has at least one message, skips.
 * @param meetingId - meeting id
 * @param transcriptionContent - optional; if not provided, will not run (caller should pass content when available)
 */
export async function generateAndSaveMeetingSummary(
	meetingId: string,
	transcriptionContent?: string | null,
): Promise<void> {
	const content = transcriptionContent?.trim();
	if (!content) return;

	const [existing] = await db
		.select({ id: meetingMessagesTable.id })
		.from(meetingMessagesTable)
		.where(eq(meetingMessagesTable.meetingId, meetingId))
		.limit(1);

	if (existing) return;

	const model = getCloudflareModel();
	const { text } = await generateText({
		model,
		system: SUMMARY_SYSTEM_PROMPT,
		prompt: content.slice(0, 30_000),
	});

	const trimmed = text.trim();
	if (!trimmed) return;

	const messageId = randomUUID();
	await db.insert(meetingMessagesTable).values({
		id: messageId,
		meetingId,
		role: "assistant",
		parts: [{ type: "text", text: trimmed }],
	});
}
