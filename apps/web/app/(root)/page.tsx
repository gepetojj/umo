"use client";

import { MicIcon, SquareIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Button } from "@/components/ui/button";
import { useRecorder } from "@/hooks/use-recorder";
import { clearChunksForMeeting } from "@/lib/db";
import { useMeetings } from "@/lib/use-meetings";
import { updateMeetingDuration } from "@/server/actions/meetings/update-meeting-duration";

function formatDuration(seconds: number) {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function NewMeetingPage() {
	const router = useRouter();
	const { addMeeting } = useMeetings();
	const { start, stop, isRecording, durationSeconds, error } = useRecorder();
	const [starting, setStarting] = useState(false);
	const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(
		null,
	);

	const handleStartRecording = useCallback(async () => {
		setStarting(true);
		const meetingId = await addMeeting("Reunião sem título");
		setCurrentMeetingId(meetingId);
		await start(meetingId);
		setStarting(false);
	}, [start, addMeeting]);

	const handleStopRecording = useCallback(async () => {
		const id = currentMeetingId;
		const { duration, totalChunks } = await stop();
		setCurrentMeetingId(null);
		if (!id) return;

		await updateMeetingDuration(id, duration, totalChunks);
		await clearChunksForMeeting(id);

		router.push(`/m/${id}`);
	}, [currentMeetingId, stop, router]);

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<Conversation className="flex-1">
				<ConversationContent>
					{!isRecording ? (
						<ConversationEmptyState
							icon={<MicIcon className="size-12" />}
							title="Iniciar nova reunião"
							description="Use o microfone para gravar esta reunião. A gravação ficará salva localmente e poderá ser transcrita depois."
						>
							{error && (
								<p
									className="mt-2 text-destructive text-sm"
									role="alert"
								>
									{error}
								</p>
							)}
							<Button
								className="mt-4 min-h-[44px]"
								onClick={handleStartRecording}
								disabled={starting}
								size="lg"
							>
								<MicIcon className="mr-2 size-5" />
								{starting
									? "Abrindo microfone…"
									: "Iniciar gravação"}
							</Button>
						</ConversationEmptyState>
					) : (
						<div className="flex flex-col items-center justify-center gap-6 p-8">
							<div className="flex items-center gap-3">
								<span
									className="relative flex size-4"
									aria-hidden
								>
									<span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75" />
									<span className="relative inline-flex size-4 rounded-full bg-destructive" />
								</span>
								<span
									className="font-mono text-2xl tabular-nums"
									aria-live="polite"
								>
									{formatDuration(durationSeconds)}
								</span>
							</div>
							<p className="text-muted-foreground text-sm">
								Gravando… Clique em Parar quando terminar.
							</p>
							<Button
								variant="destructive"
								size="lg"
								className="min-h-[44px]"
								onClick={handleStopRecording}
							>
								<SquareIcon className="mr-2 size-5" />
								Parar gravação
							</Button>
						</div>
					)}
				</ConversationContent>
			</Conversation>
		</div>
	);
}
