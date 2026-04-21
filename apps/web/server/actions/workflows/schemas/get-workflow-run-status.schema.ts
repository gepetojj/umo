import { z } from "zod";

export const getWorkflowRunStatusSchema = z.object({
	runId: z.string().min(1),
});
