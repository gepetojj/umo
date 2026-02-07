"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { addChunk } from "@/lib/db";
import { uploadChunk } from "@/server/actions/objects/upload-chunk";

const TIMESLICE_MS = 10_000;
const MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"];

function getSupportedMimeType(): string | null {
	for (const mime of MIME_TYPES) {
		if (MediaRecorder.isTypeSupported(mime)) return mime;
	}
	return null;
}

export function useRecorder() {
	const [isRecording, setIsRecording] = useState(false);
	const [durationSeconds, setDurationSeconds] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const streamRef = useRef<MediaStream | null>(null);
	const recorderRef = useRef<MediaRecorder | null>(null);
	const meetingIdRef = useRef<string | null>(null);
	const chunkIndexRef = useRef(0);
	const startTimeRef = useRef<number>(0);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const pendingUploadsRef = useRef<Promise<void>[]>([]);

	const stopTimer = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	useEffect(() => {
		return () => {
			stopTimer();
			recorderRef.current?.state !== "inactive" &&
				recorderRef.current?.stop();
			streamRef.current?.getTracks().forEach((t) => {
				t.stop();
			});
		};
	}, [stopTimer]);

	const start = useCallback(async (meetingId: string) => {
		setError(null);
		meetingIdRef.current = meetingId;
		chunkIndexRef.current = 0;
		startTimeRef.current = Date.now();
		pendingUploadsRef.current = [];
		setDurationSeconds(0);

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});
			streamRef.current = stream;

			const mimeType = getSupportedMimeType();
			const recorder = new MediaRecorder(stream, {
				audioBitsPerSecond: 128_000,
				...(mimeType && { mimeType }),
			});

			recorder.ondataavailable = (e) => {
				if (e.data.size > 0 && meetingIdRef.current) {
					const meetingId = meetingIdRef.current;
					const index = chunkIndexRef.current;
					chunkIndexRef.current += 1; // Increment SYNCHRONOUSLY before async work

					// Each upload runs independently in parallel.
					// uploadChunk only does S3 + DB (fast), no transcription.
					const promise = (async () => {
						await addChunk(meetingId, index, e.data);
						const formData = new FormData();
						formData.set("meetingId", meetingId);
						formData.set("chunkIndex", String(index));
						formData.set("chunk", e.data);
						await uploadChunk(formData);
					})().catch((err) => {
						console.error(`Failed to upload chunk ${index}:`, err);
					});

					pendingUploadsRef.current.push(promise);
				}
			};

			recorder.start(TIMESLICE_MS);
			recorderRef.current = recorder;
			setIsRecording(true);

			timerRef.current = setInterval(() => {
				setDurationSeconds(
					Math.floor((Date.now() - startTimeRef.current) / 1000),
				);
			}, 1000);
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Falha ao acessar o microfone.";
			setError(message);
			setIsRecording(false);
		}
	}, []);

	const stop = useCallback(async (): Promise<{
		duration: number;
		totalChunks: number;
	}> => {
		const recorder = recorderRef.current;
		const stream = streamRef.current;
		const startTime = startTimeRef.current;

		stopTimer();
		recorderRef.current = null;
		streamRef.current = null;
		setIsRecording(false);

		// Stop the recorder and wait for the final ondataavailable event to fire.
		// Important: meetingIdRef is still set so the final chunk handler runs.
		if (recorder && recorder.state !== "inactive") {
			await new Promise<void>((resolve) => {
				recorder.onstop = () => resolve();
				recorder.stop();
			});
		}

		stream?.getTracks().forEach((t) => {
			t.stop();
		});

		// Wait for all parallel uploads (including the final chunk) to complete
		await Promise.all(pendingUploadsRef.current);
		pendingUploadsRef.current = [];

		const totalChunks = chunkIndexRef.current;

		// Now safe to clear meetingId after all uploads are done
		meetingIdRef.current = null;

		const duration = startTime
			? Math.floor((Date.now() - startTime) / 1000)
			: 0;
		setDurationSeconds(0);
		return { duration, totalChunks };
	}, [stopTimer]);

	return { start, stop, isRecording, durationSeconds, error };
}
