import { NextRequest } from "next/server";
import { z } from "zod";

import { saveMeetingMessage } from "@/server/actions/meetings/save-meeting-message";

const bodySchema = z.object({
	meetingId: z.string().uuid(),
	message: z.object({
		id: z.string(),
		role: z.enum(["user", "assistant", "system"]),
		parts: z.array(z.unknown()),
	}),
});

export async function POST(req: NextRequest) {
	let body: z.infer<typeof bodySchema>;
	try {
		body = bodySchema.parse(await req.json());
	} catch {
		return new Response(
			JSON.stringify({ ok: false, error: "Invalid body" }),
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	const result = await saveMeetingMessage(
		body.meetingId,
		body.message as never,
	);
	return Response.json(result);
}
