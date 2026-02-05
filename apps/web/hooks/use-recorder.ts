"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { addChunk } from "@/lib/db";

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

			recorder.ondataavailable = async (e) => {
				if (e.data.size > 0 && meetingIdRef.current) {
					try {
						await addChunk(
							meetingIdRef.current,
							chunkIndexRef.current,
							e.data,
						);
						chunkIndexRef.current += 1;
					} catch (err) {
						console.error("Failed to save chunk:", err);
					}
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

	const stop = useCallback(async (): Promise<number> => {
		const recorder = recorderRef.current;
		const stream = streamRef.current;
		const startTime = startTimeRef.current;

		stopTimer();
		recorderRef.current = null;
		streamRef.current = null;
		meetingIdRef.current = null;
		setIsRecording(false);

		if (recorder && recorder.state !== "inactive") {
			recorder.stop();
		}
		stream?.getTracks().forEach((t) => {
			t.stop();
		});

		const duration = startTime
			? Math.floor((Date.now() - startTime) / 1000)
			: 0;
		setDurationSeconds(0);
		return duration;
	}, [stopTimer]);

	return { start, stop, isRecording, durationSeconds, error };
}
