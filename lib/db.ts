import { type DBSchema, type IDBPDatabase, openDB } from "idb";

const DB_NAME = "umo";
const DB_VERSION = 1;

export interface MeetingRecord {
	id: string;
	title: string;
	createdAt: number;
	durationSeconds: number;
}

export interface ChunkRecord {
	meetingId: string;
	index: number;
	blob: Blob;
}

interface UmoDB extends DBSchema {
	meetings: {
		key: string;
		value: MeetingRecord;
		indexes: { "by-createdAt": number };
	};
	chunks: {
		key: [string, number];
		value: ChunkRecord;
		indexes: { meetingId: string };
	};
}

let dbPromise: Promise<IDBPDatabase<UmoDB>> | null = null;

function getDB() {
	if (dbPromise) return dbPromise;
	dbPromise = openDB<UmoDB>(DB_NAME, DB_VERSION, {
		upgrade(database) {
			const meetingsStore = database.createObjectStore("meetings", {
				keyPath: "id",
			});
			meetingsStore.createIndex("by-createdAt", "createdAt");

			const chunksStore = database.createObjectStore("chunks", {
				keyPath: ["meetingId", "index"],
			});
			chunksStore.createIndex("meetingId", "meetingId");
		},
	});
	return dbPromise;
}

export async function addMeeting(
	meeting: Omit<MeetingRecord, "durationSeconds"> & {
		durationSeconds?: number;
	},
): Promise<void> {
	const db = await getDB();
	await db.add("meetings", {
		...meeting,
		durationSeconds: meeting.durationSeconds ?? 0,
	});
}

export async function getMeetings(): Promise<MeetingRecord[]> {
	const db = await getDB();
	const list = await db.getAllFromIndex("meetings", "by-createdAt");
	return list.reverse();
}

export async function getMeeting(
	id: string,
): Promise<MeetingRecord | undefined> {
	const db = await getDB();
	return db.get("meetings", id);
}

export async function updateMeetingTitle(
	id: string,
	title: string,
): Promise<void> {
	const db = await getDB();
	const meeting = await db.get("meetings", id);
	if (meeting) {
		await db.put("meetings", { ...meeting, title });
	}
}

export async function addChunk(
	meetingId: string,
	index: number,
	blob: Blob,
): Promise<void> {
	const db = await getDB();
	await db.add("chunks", { meetingId, index, blob });
}

export async function getChunksForMeeting(meetingId: string): Promise<Blob[]> {
	const db = await getDB();
	const chunks = await db.getAllFromIndex("chunks", "meetingId", meetingId);
	chunks.sort((a, b) => a.index - b.index);
	return chunks.map((c) => c.blob);
}

/** Assembles all chunks into a single Blob for playback or upload. */
export async function getRecordingBlob(
	meetingId: string,
): Promise<Blob | null> {
	const blobs = await getChunksForMeeting(meetingId);
	if (blobs.length === 0) return null;
	return new Blob(blobs, { type: blobs[0]?.type ?? "audio/webm" });
}

export async function deleteMeeting(id: string): Promise<void> {
	const db = await getDB();
	const tx = db.transaction(["meetings", "chunks"], "readwrite");
	const chunks = await tx.objectStore("chunks").getAllKeys();
	const toDelete = chunks.filter((key) => key[0] === id);
	for (const key of toDelete) {
		await tx.objectStore("chunks").delete(key);
	}
	await tx.objectStore("meetings").delete(id);
	await tx.done;
}
