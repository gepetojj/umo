"use client";

import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
	PromptInputProvider,
	PromptInputSubmit,
	PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { MeetingContextCard } from "@/components/meeting-context-card";
import { Button } from "@/components/ui/button";
import { getRecordingBlob } from "@/lib/db";
import { meetingsQueryKey } from "@/lib/use-meetings";
import { getMeeting } from "@/server/actions/meetings/get-meeting";
import { getMeetingMessages } from "@/server/actions/meetings/get-meeting-messages";
import { processTranscriptions } from "@/server/actions/transcriptions/process-transcriptions";

const MEETING_SUGGESTIONS = [
	"Quais foram os principais pontos discutidos?",
	"Liste os action items da reunião.",
	"Resuma as decisões tomadas.",
	"Houve algum bloqueio ou dúvida pendente?",
];

export default function MeetingChatPage() {
	const params = useParams();
	const id = typeof params.id === "string" ? params.id : null;
	const [meeting, setMeeting] = useState<Awaited<
		ReturnType<typeof getMeeting>
	> | null>(null);
	const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
	const [loading, setLoading] = useState(true);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [recordingFailed, setRecordingFailed] = useState(false);
	const [transcriptionQueued, setTranscriptionQueued] = useState(false);
	const [transcriptionError, setTranscriptionError] = useState<string | null>(
		null,
	);
	const transcriptionTriggeredRef = useRef(false);
	const sidebarInvalidatedRef = useRef(false);
	const queryClient = useQueryClient();

	const refetchMeeting = useCallback(async () => {
		if (!id) return;
		const m = await getMeeting(id);
		setMeeting(m ?? null);
	}, [id]);

	// Carrega reunião + mensagens em paralelo
	useEffect(() => {
		if (!id) {
			setLoading(false);
			return;
		}
		let cancelled = false;
		Promise.all([getMeeting(id), getMeetingMessages(id)]).then(
			([m, messages]) => {
				if (!cancelled) {
					setMeeting(m ?? null);
					setInitialMessages(messages);
				}
				setLoading(false);
			},
		);
		return () => {
			cancelled = true;
		};
	}, [id]);

	// Dispara transcrição para gravações chunk-based
	useEffect(() => {
		if (
			!id ||
			!meeting ||
			meeting.transcriptionId ||
			!meeting.transcriptionPending ||
			!meeting.totalChunks ||
			transcriptionTriggeredRef.current
		)
			return;
		transcriptionTriggeredRef.current = true;
		setTranscriptionError(null);
		setTranscriptionQueued(true);
		processTranscriptions({ meetingId: id })
			.then(() => {
				refetchMeeting();
			})
			.catch((e) => {
				setTranscriptionQueued(false);
				setTranscriptionError(
					e instanceof Error
						? e.message
						: "Falha ao processar transcrições",
				);
			});
	}, [id, meeting, refetchMeeting]);

	// Polling: atualiza meeting quando transcrição estiver pronta
	useEffect(() => {
		if (
			!id ||
			!meeting ||
			meeting.transcriptionId ||
			(!transcriptionQueued && !meeting.transcriptionPending)
		)
			return;
		const interval = setInterval(async () => {
			await refetchMeeting();
			// Recarrega mensagens quando transcrição fica pronta (resumo pode ter sido gerado)
			const msgs = await getMeetingMessages(id);
			setInitialMessages(msgs);
		}, 4000);
		return () => clearInterval(interval);
	}, [id, transcriptionQueued, meeting, refetchMeeting]);

	// Invalida sidebar quando transcrição fica pronta
	useEffect(() => {
		if (!meeting?.transcriptionId || sidebarInvalidatedRef.current) return;
		sidebarInvalidatedRef.current = true;
		queryClient.invalidateQueries({ queryKey: meetingsQueryKey });
	}, [meeting?.transcriptionId, queryClient]);

	// Carrega áudio
	useEffect(() => {
		if (!id || !meeting) return;
		let cancelled = false;
		setRecordingFailed(false);
		const key =
			meeting.recordingChunkKeys?.[0] ?? meeting.recordingKey ?? null;
		if (key) {
			const base = process.env.NEXT_PUBLIC_S3_PUBLIC_URL ?? "";
			setAudioUrl(base ? `${base}/${key}` : null);
			if (!base) setRecordingFailed(true);
			return;
		}
		getRecordingBlob(id)
			.then((blob) => {
				if (cancelled) return;
				if (blob) setAudioUrl(URL.createObjectURL(blob));
				else setRecordingFailed(true);
			})
			.catch(() => {
				if (!cancelled) setRecordingFailed(true);
			});
		return () => {
			cancelled = true;
		};
	}, [id, meeting]);

	useEffect(() => {
		return () => {
			if (audioUrl?.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
		};
	}, [audioUrl]);

	const chatAvailable = Boolean(
		id &&
			meeting?.transcriptionId &&
			!recordingFailed &&
			!transcriptionError,
	);

	const transport = useMemo(
		() =>
			new DefaultChatTransport({
				api: "/api/chat",
				body: { meetingId: id ?? "" },
			}),
		[id],
	);

	const { messages, sendMessage, status, stop, setMessages } = useChat({
		transport,
		messages: initialMessages,
		onFinish: (event) => {
			const { message } = event;
			if (!id || message.role !== "assistant") return;
			fetch("/api/chat/message", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					meetingId: id,
					message: {
						id: message.id,
						role: message.role,
						parts: message.parts,
					},
				}),
			}).catch(console.error);
		},
	});

	// Sincroniza mensagens iniciais quando carregam após o primeiro render
	useEffect(() => {
		if (initialMessages.length > 0 && messages.length === 0) {
			setMessages(initialMessages);
		}
	}, [initialMessages, messages.length, setMessages]);

	const handleSubmit = useCallback(
		(
			payload: {
				text: string;
				files: { url: string; filename?: string; mediaType?: string }[];
			},
			event: React.FormEvent,
		) => {
			event.preventDefault();
			if (!payload.text.trim() && payload.files.length === 0) return;
			sendMessage({ text: payload.text });
		},
		[sendMessage],
	);

	const handleSuggestion = useCallback(
		(suggestion: string) => {
			sendMessage({ text: suggestion });
		},
		[sendMessage],
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

	const hasMessages = messages.length > 0;

	// Bloco de status (transcrição em andamento / erro) — só no layout centralizado
	const transcriptionStatus = (
		<>
			{(transcriptionQueued || meeting.transcriptionPending) &&
				!meeting.transcriptionId &&
				!transcriptionError && (
					<p className="text-muted-foreground text-sm">
						{meeting.transcriptionPending
							? "Transcrição em andamento…"
							: "Transcrição na fila…"}
					</p>
				)}
			{transcriptionError && (
				<div className="flex flex-wrap items-center gap-2" role="alert">
					<p className="text-destructive text-sm">
						{transcriptionError}
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setTranscriptionError(null);
							setTranscriptionQueued(true);
							transcriptionTriggeredRef.current = true;
							processTranscriptions({ meetingId: id })
								.then(() => refetchMeeting())
								.catch((e) => {
									setTranscriptionQueued(false);
									setTranscriptionError(
										e instanceof Error
											? e.message
											: "Falha ao processar transcrições",
									);
								});
						}}
					>
						Tentar novamente
					</Button>
				</div>
			)}
		</>
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<PromptInputProvider>
				{!hasMessages && (
					<div
						className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto px-6 py-12 transition-all duration-300 ease-out"
						aria-hidden={hasMessages}
					>
						<div className="w-full max-w-2xl space-y-4 rounded-2xl bg-card/40 px-6 py-6">
							<MeetingContextCard
								meeting={meeting}
								audioUrl={audioUrl}
								recordingFailed={recordingFailed}
								transcriptionFailed={!!transcriptionError}
								compact={false}
							/>
							{transcriptionStatus}
						</div>
					</div>
				)}

				{/* Com mensagens: header fixo no topo, mensagens com scroll no meio, input fixo no rodapé */}
				{hasMessages && (
					<>
						<header className="shrink-0 border-border/60 border-b bg-background px-4 py-3">
							<MeetingContextCard
								meeting={meeting}
								audioUrl={audioUrl}
								recordingFailed={recordingFailed}
								transcriptionFailed={!!transcriptionError}
								hideSteps
								compact
							/>
						</header>
						<Conversation className="min-h-0 flex-1 overflow-y-auto">
							<ConversationContent className="flex flex-col gap-8">
								{messages.map((message) => (
									<Message
										from={message.role}
										key={message.id}
									>
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
					</>
				)}

				<div className="shrink-0 border-t bg-background p-4">
					{recordingFailed ? (
						<div
							className="mx-auto max-w-3xl rounded-lg border border-muted-foreground/25 border-dashed bg-muted/30 px-4 py-4 text-center"
							aria-live="polite"
						>
							<p className="text-muted-foreground text-sm">
								Este chat está desativado devido a uma falha com
								a gravação.
							</p>
						</div>
					) : !chatAvailable ? (
						<PromptInput
							onSubmit={(_, e) => e.preventDefault()}
							className="mx-auto max-w-3xl"
						>
							<PromptInputBody>
								<PromptInputTextarea
									value=""
									onChange={() => {}}
									placeholder="Aguarde a transcrição para fazer perguntas sobre a reunião…"
									className="min-h-[44px]"
								/>
							</PromptInputBody>
							<PromptInputFooter>
								<PromptInputSubmit
									disabled
									status="ready"
									title="Chat disponível após a transcrição"
								/>
							</PromptInputFooter>
						</PromptInput>
					) : (
						<div className="mx-auto max-w-3xl space-y-3">
							{messages.length === 0 && (
								<div className="flex flex-wrap gap-2">
									{MEETING_SUGGESTIONS.map((suggestion) => (
										<Button
											key={suggestion}
											size="sm"
											variant="outline"
											className="text-muted-foreground hover:text-foreground"
											onClick={() =>
												handleSuggestion(suggestion)
											}
										>
											{suggestion}
										</Button>
									))}
								</div>
							)}
							<PromptInput
								onSubmit={handleSubmit}
								className="w-full"
							>
								<PromptInputBody>
									<PromptInputTextarea
										placeholder="Pergunte sobre a reunião…"
										className="min-h-[44px]"
									/>
								</PromptInputBody>
								<PromptInputFooter>
									<PromptInputSubmit
										status={
											status === "streaming" ||
											status === "submitted"
												? "streaming"
												: "ready"
										}
										disabled={
											status === "streaming" ||
											status === "submitted"
										}
										onStop={stop}
									/>
								</PromptInputFooter>
							</PromptInput>
						</div>
					)}
				</div>
			</PromptInputProvider>
		</div>
	);
}
