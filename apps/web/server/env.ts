import { z } from "zod";

export const env = z
	.object({
		NEXT_PUBLIC_S3_PUBLIC_URL: z.string(),
		S3_ACCESS_KEY: z.string(),
		S3_SECRET_KEY: z.string(),
		S3_ENDPOINT: z.string().optional(),
		S3_BUCKET: z.string(),
		S3_REGION: z.string(),

		DATABASE_URL: z.string(),

		CLOUDFLARE_ACCOUNT_ID: z.string(),
		CLOUDFLARE_AIG_API_KEY: z.string(),
		CLOUDFLARE_EMAIL_API_KEY: z.string(),
		TRANSACTIONAL_EMAIL_FROM: z.string(),

		CLERK_SECRET_KEY: z.string(),
		CLERK_WEBHOOK_SECRET: z.string(),

		NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string(),
		STRIPE_SECRET_KEY: z.string(),
		STRIPE_WEBHOOK_SECRET: z.string(),
		STRIPE_STARTER_PRICE_ID: z.string(),
		STRIPE_GOLD_PRICE_ID: z.string(),
		STRIPE_SEATS_PRICE_ID: z.string(),
	})
	.parse(process.env);
