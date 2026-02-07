/**
 * Build WebVTT from segments with start/end in seconds.
 */
function formatVttTime(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	const ms = Math.round((s % 1) * 1000);
	const sec = Math.floor(s);
	return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

export interface Segment {
	start: number;
	end: number;
	text: string;
}

export function segmentsToVtt(segments: Segment[]): string {
	if (segments.length === 0) return "WEBVTT\n\n";
	const lines = ["WEBVTT", ""];
	for (const seg of segments) {
		lines.push(
			`${formatVttTime(seg.start)} --> ${formatVttTime(seg.end)}`,
			seg.text.trim(),
			"",
		);
	}
	return lines.join("\n");
}

/**
 * Parse WebVTT and add offset (in seconds) to all timestamps.
 * Simple parser: lines like "00:00.000 --> 00:05.000" are timestamp lines.
 */
function parseVttTime(s: string): number {
	const parts = s.trim().split(/[:.]/);
	if (parts.length >= 4) {
		const h = Number.parseInt(parts[0] ?? "0", 10) || 0;
		const m = Number.parseInt(parts[1] ?? "0", 10) || 0;
		const sec = Number.parseInt(parts[2] ?? "0", 10) || 0;
		const ms = Number.parseInt(parts[3] ?? "0", 10) || 0;
		return h * 3600 + m * 60 + sec + ms / 1000;
	}
	return 0;
}

function formatVttTimeFromSeconds(seconds: number): string {
	return formatVttTime(seconds);
}

const VTT_TIMESTAMP_LINE =
	/^(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/;

export function offsetVtt(vtt: string, offsetSeconds: number): string {
	if (!vtt || offsetSeconds <= 0) return vtt;
	const lines = vtt.split("\n");
	const out: string[] = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? "";
		const m = line.match(VTT_TIMESTAMP_LINE);
		if (m) {
			const start = parseVttTime(m[1] ?? "0");
			const end = parseVttTime(m[2] ?? "0");
			out.push(
				`${formatVttTimeFromSeconds(start + offsetSeconds)} --> ${formatVttTimeFromSeconds(end + offsetSeconds)}`,
			);
		} else {
			out.push(line);
		}
	}
	return out.join("\n");
}

/**
 * Get last cue end time from VTT in seconds (for chunk duration).
 */
export function getVttEndSeconds(vtt: string): number {
	if (!vtt) return 0;
	const lines = vtt.split("\n");
	let lastEnd = 0;
	for (const line of lines) {
		const m = line.match(VTT_TIMESTAMP_LINE);
		if (m) lastEnd = parseVttTime(m[2] ?? "0");
	}
	return lastEnd;
}
