"use server";

import { getRun } from "workflow/api";

import { authActionClient } from "@/server/actions/safe-action";
import { getWorkflowRunStatusSchema } from "@/server/actions/workflows/schemas/get-workflow-run-status.schema";

export const getWorkflowRunStatusAction = authActionClient
	.inputSchema(getWorkflowRunStatusSchema)
	.action(async ({ parsedInput: { runId } }) => {
		const run = getRun(runId);
		const status = await run.status;
		return { status };
	});
