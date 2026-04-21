import { NextRequest } from "next/server";
import { z } from "zod";

import { unwrapSafeActionResult } from "@/lib/unwrap-safe-action-result";
import { saveMeetingMessageAction } from "@/server/actions/meetings/save-meeting-message.action";

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

	unwrapSafeActionResult(
		await saveMeetingMessageAction({
			meetingId: body.meetingId,
			message: body.message,
		}),
	);
	return Response.json({ ok: true });
}
