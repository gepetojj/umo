import { z } from "zod";

export const createMeetingSchema = z.object({
	title: z.string().min(1).max(500),
	/** Apenas Gold com workspace; demais ignoram. */
	visibility: z
		.enum(["workspace", "private"])
		.optional()
		.default("workspace"),
});
