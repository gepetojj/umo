"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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
import { meetingsQueryKey } from "@/lib/use-meetings";
import { getMeeting } from "@/server/actions/meetings/get-meeting";
import { processTranscriptions } from "@/server/actions/transcriptions/process-transcriptions";

export default function MeetingChatPage() {
	const params = useParams();
	const id = typeof params.id === "string" ? params.id : null;
	const [meeting, setMeeting] = useState<Awaited<
		ReturnType<typeof getMeeting>
	> | null>(null);
	const [loading, setLoading] = useState(true);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [recordingFailed, setRecordingFailed] = useState(false);
	const [transcriptionQueued, setTranscriptionQueued] = useState(false);
	const [transcriptionError, setTranscriptionError] = useState<string | null>(
		null,
	);
	const transcriptionTriggeredRef = useRef(false);
	const sidebarInvalidatedRef = useRef(false);
	const [input, setInput] = useState("");
	const queryClient = useQueryClient();

	const refetchMeeting = useCallback(async () => {
		if (!id) return;
		const m = await getMeeting(id);
		setMeeting(m ?? null);
	}, [id]);

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

	// Dispara transcrição para gravações chunk-based (totalChunks definido)
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

	// Polling: atualiza meeting quando transcrição estiver pronta (legado na fila ou chunk-based em andamento)
	useEffect(() => {
		if (
			!id ||
			!meeting ||
			meeting.transcriptionId ||
			(!transcriptionQueued && !meeting.transcriptionPending)
		)
			return;
		const interval = setInterval(refetchMeeting, 4000);
		return () => clearInterval(interval);
	}, [id, transcriptionQueued, meeting, refetchMeeting]);

	// Quando a transcrição fica pronta, invalida a query do sidebar para atualizar o título da meeting
	useEffect(() => {
		if (!meeting?.transcriptionId || sidebarInvalidatedRef.current) return;
		sidebarInvalidatedRef.current = true;
		queryClient.invalidateQueries({ queryKey: meetingsQueryKey });
	}, [meeting?.transcriptionId, queryClient]);

	// Carrega áudio: URL do S3 se já registrou upload, senão blob temporário do IDB
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
						<div className="shrink-0 space-y-1">
							<MeetingContextCard
								meeting={meeting}
								audioUrl={audioUrl}
								recordingFailed={recordingFailed}
								transcriptionFailed={!!transcriptionError}
								compact
							/>
							{(transcriptionQueued ||
								meeting.transcriptionPending) &&
								!meeting.transcriptionId &&
								!transcriptionError && (
									<p className="text-muted-foreground text-sm">
										{meeting.transcriptionPending
											? "Transcrição em andamento…"
											: "Transcrição na fila…"}
									</p>
								)}
							{transcriptionError && (
								<div
									className="flex flex-wrap items-center gap-2"
									role="alert"
								>
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
											processTranscriptions({
												meetingId: id,
											})
												.then(() => refetchMeeting())
												.catch((e) => {
													setTranscriptionQueued(
														false,
													);
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
						</div>
					) : (
						<div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 py-8">
							<MeetingContextCard
								meeting={meeting}
								audioUrl={audioUrl}
								recordingFailed={recordingFailed}
								transcriptionFailed={!!transcriptionError}
								compact={false}
								className="w-full max-w-lg"
							/>
							{(transcriptionQueued ||
								meeting.transcriptionPending) &&
								!meeting.transcriptionId &&
								!transcriptionError && (
									<p className="text-muted-foreground text-sm">
										{meeting.transcriptionPending
											? "Transcrição em andamento…"
											: "Transcrição na fila…"}
									</p>
								)}
							{transcriptionError && (
								<div
									className="flex flex-col items-center gap-2 text-center"
									role="alert"
								>
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
											processTranscriptions({
												meetingId: id,
											})
												.then(() => refetchMeeting())
												.catch((e) => {
													setTranscriptionQueued(
														false,
													);
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
