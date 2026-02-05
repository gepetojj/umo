import { type DBSchema, type IDBPDatabase, openDB } from "idb";

const DB_NAME = "umo";
const DB_VERSION = 1;

/** Chunk temporário de áudio durante a gravação (meetingId = UUID do meeting no Postgres). */
export interface ChunkRecord {
	meetingId: string;
	index: number;
	blob: Blob;
}

interface UmoDB extends DBSchema {
	meetings: {
		key: string;
		value: unknown;
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
			if (!database.objectStoreNames.contains("meetings")) {
				const meetingsStore = database.createObjectStore("meetings", {
					keyPath: "id",
				});
				meetingsStore.createIndex("by-createdAt", "createdAt");
			}
			if (!database.objectStoreNames.contains("chunks")) {
				const chunksStore = database.createObjectStore("chunks", {
					keyPath: ["meetingId", "index"],
				});
				chunksStore.createIndex("meetingId", "meetingId");
			}
		},
	});
	return dbPromise;
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

/** Monta todos os chunks em um único Blob para upload ou playback local. */
export async function getRecordingBlob(
	meetingId: string,
): Promise<Blob | null> {
	const blobs = await getChunksForMeeting(meetingId);
	if (blobs.length === 0) return null;
	return new Blob(blobs, { type: blobs[0]?.type ?? "audio/webm" });
}

/** Remove todos os chunks da reunião (após upload bem-sucedido para o S3). */
export async function clearChunksForMeeting(meetingId: string): Promise<void> {
	const db = await getDB();
	const keys = await db.getAllKeysFromIndex("chunks", "meetingId", meetingId);
	await Promise.all(keys.map((key) => db.delete("chunks", key)));
}
