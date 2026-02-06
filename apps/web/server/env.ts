import z from "zod";

export const env = z
	.object({
		NEXT_PUBLIC_S3_PUBLIC_URL: z.string(),
		S3_ACCESS_KEY: z.string(),
		S3_SECRET_KEY: z.string(),
		S3_ENDPOINT: z.string().optional(),
		S3_BUCKET: z.string(),
		S3_REGION: z.string(),

		DATABASE_URL: z.string(),

		TRANSCRIPTIONS_URL: z.string(),
		TRANSCRIPTIONS_API_KEY: z.string(),
	})
	.parse(process.env);
