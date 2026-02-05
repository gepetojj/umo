"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
	Message,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
import {
	PromptInput,
	PromptInputBody,
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { MeetingContextCard } from "@/components/meeting-context-card";
import { Button } from "@/components/ui/button";
import { getRecordingBlob } from "@/lib/db";
import { getMeeting } from "@/server/actions/meetings/get-meeting";

export default function MeetingChatPage() {
	const params = useParams();
	const id = typeof params.id === "string" ? params.id : null;
	const [meeting, setMeeting] = useState<Awaited<
		ReturnType<typeof getMeeting>
	> | null>(null);
	const [loading, setLoading] = useState(true);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [recordingFailed, setRecordingFailed] = useState(false);
	const [input, setInput] = useState("");

	// Carrega reunião
	useEffect(() => {
		if (!id) {
			setLoading(false);
			return;
		}
		let cancelled = false;
		getMeeting(id).then((m) => {
			if (!cancelled) {
				setMeeting(m ?? null);
			}
			setLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, [id]);

	// Carrega áudio: URL do S3 se já registrou upload, senão blob temporário do IDB
	useEffect(() => {
		if (!id || !meeting) return;
		let cancelled = false;
		setRecordingFailed(false);

		if (meeting.recordingKey) {
			const base = process.env.NEXT_PUBLIC_S3_PUBLIC_URL ?? "";
			setAudioUrl(base ? `${base}/${meeting.recordingKey}` : null);
			if (!base) setRecordingFailed(true);
			return;
		}

		getRecordingBlob(id)
			.then((blob) => {
				if (cancelled) return;
				if (blob) {
					setAudioUrl(URL.createObjectURL(blob));
				} else {
					setRecordingFailed(true);
				}
			})
			.catch(() => {
				if (!cancelled) setRecordingFailed(true);
			});
		return () => {
			cancelled = true;
		};
	}, [id, meeting]);

	// Revoga object URL ao desmontar (apenas blob URLs do IDB)
	useEffect(() => {
		return () => {
			if (audioUrl?.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
		};
	}, [audioUrl]);

	const handleSubmit = useCallback(
		(
			_message: { text: string; files: unknown[] },
			event: React.FormEvent,
		) => {
			event.preventDefault();
			// API de chat ainda não implementada; submit desabilitado na UI
		},
		[],
	);

	if (loading || !id) {
		return (
			<div className="flex flex-1 items-center justify-center p-8">
				{!id ? (
					<p className="text-muted-foreground">
						Reunião não encontrada.
					</p>
				) : (
					<p className="text-muted-foreground">Carregando…</p>
				)}
			</div>
		);
	}

	if (!meeting) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
				<p className="text-muted-foreground">Reunião não encontrada.</p>
				<Button asChild variant="outline">
					<Link href="/">Nova reunião</Link>
				</Button>
			</div>
		);
	}

	const displayMessages = [
		{
			id: "placeholder",
			role: "assistant" as const,
			parts: [
				{
					type: "text" as const,
					text: "Gravação disponível. Transcrição e resumo em breve.",
				},
			],
		},
	];

	const hasRealMessages = displayMessages.length > 1;

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<Conversation className="flex-1">
				<ConversationContent className="flex flex-col gap-8">
					{/* Bloco de contexto: centralizado sem outras mensagens, no topo e resumido com mensagens */}
					{hasRealMessages ? (
						<div className="shrink-0">
							<MeetingContextCard
								meeting={meeting}
								audioUrl={audioUrl}
								recordingFailed={recordingFailed}
								compact
							/>
						</div>
					) : (
						<div className="flex min-h-0 flex-1 flex-col items-center justify-center py-8">
							<MeetingContextCard
								meeting={meeting}
								audioUrl={audioUrl}
								recordingFailed={recordingFailed}
								compact={false}
								className="w-full max-w-lg"
							/>
						</div>
					)}

					{/* Mensagens do chat (só exibe quando há mensagens além do placeholder) */}
					{hasRealMessages &&
						displayMessages.map((message) => (
							<Message from={message.role} key={message.id}>
								<MessageContent>
									{message.parts.map((part, i) => {
										if (part.type === "text") {
											return (
												<MessageResponse
													key={`${message.id}-${i}`}
												>
													{part.text}
												</MessageResponse>
											);
										}
										return null;
									})}
								</MessageContent>
							</Message>
						))}
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>

			<div className="border-t p-4">
				{recordingFailed ? (
					<div
						className="mx-auto max-w-3xl rounded-lg border border-muted-foreground/25 border-dashed bg-muted/30 px-4 py-4 text-center"
						aria-live="polite"
					>
						<p className="text-muted-foreground text-sm">
							Este chat está desativado devido a uma falha com a
							gravação.
						</p>
					</div>
				) : (
					<PromptInput
						onSubmit={handleSubmit}
						className="mx-auto max-w-3xl"
					>
						<PromptInputBody>
							<PromptInputTextarea
								value={input}
								onChange={(e) =>
									setInput(e.currentTarget.value)
								}
								placeholder="Em breve você poderá fazer perguntas sobre a reunião…"
								className="min-h-[44px]"
							/>
						</PromptInputBody>
						<PromptInputFooter>
							<PromptInputSubmit
								disabled
								status="ready"
								title="Chat com a reunião em breve"
							/>
						</PromptInputFooter>
					</PromptInput>
				)}
			</div>
		</div>
	);
}
