"use client";

import { PlayIcon } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import type { MeetingRecord } from "@/lib/db";
import { getMeeting, getRecordingBlob } from "@/lib/db";

export default function MeetingChatPage() {
	const params = useParams();
	const id = typeof params.id === "string" ? params.id : null;
	const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
	const [loading, setLoading] = useState(true);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [input, setInput] = useState("");

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

	useEffect(() => {
		return () => {
			if (audioUrl) URL.revokeObjectURL(audioUrl);
		};
	}, [audioUrl]);

	const handlePlayRecording = useCallback(async () => {
		if (!id) return;
		if (audioUrl) {
			URL.revokeObjectURL(audioUrl);
			setAudioUrl(null);
			return;
		}
		const blob = await getRecordingBlob(id);
		if (blob) {
			setAudioUrl(URL.createObjectURL(blob));
		}
	}, [id, audioUrl]);

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

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<Conversation className="flex-1">
				<ConversationContent>
					{id && audioUrl && (
						<div className="flex justify-center py-4">
							<audio
								controls
								src={audioUrl}
								className="w-full max-w-md"
								preload="metadata"
								aria-label="Reproduzir gravação da reunião"
							>
								<track kind="captions" />
							</audio>
						</div>
					)}
					{displayMessages.map((message) => (
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
				{id && (
					<div className="mb-3 flex justify-center">
						<Button
							variant="outline"
							size="sm"
							onClick={handlePlayRecording}
							className="min-h-[44px]"
						>
							<PlayIcon className="mr-2 size-4" />
							{audioUrl ? "Ocultar player" : "Ouvir gravação"}
						</Button>
					</div>
				)}
				<PromptInput
					onSubmit={handleSubmit}
					className="mx-auto max-w-3xl"
				>
					<PromptInputBody>
						<PromptInputTextarea
							value={input}
							onChange={(e) => setInput(e.currentTarget.value)}
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
			</div>
		</div>
	);
}
