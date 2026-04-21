import { processAllTranscriptions } from "@/server/transcriptions/transcribe-chunk";

async function transcribeMeetingStep(meetingId: string) {
	"use step";

	await processAllTranscriptions(meetingId);
}

export async function meetingTranscriptionWorkflow(meetingId: string) {
	"use workflow";

	await transcribeMeetingStep(meetingId);
	return { ok: true as const };
}
