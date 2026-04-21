"use server";

import { getRun } from "workflow/api";

/**
 * Lightweight status read for UI polling (e.g. transcription workflow completion / failure).
 */
export async function getWorkflowRunStatus(runId: string) {
	const run = getRun(runId);
	const status = await run.status;
	return { status };
}
