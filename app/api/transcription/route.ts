import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({
	meetingId: z.string(),
});

export const POST = async (req: NextRequest) => {
	const { meetingId } = schema.parse(await req.json());
};
