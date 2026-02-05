import "dotenv/config";

import { defineConfig } from "drizzle-kit";

import { env } from "@/server/env";

export default defineConfig({
	out: "./server/db/migrations",
	schema: "./server/db/schema",
	dialect: "postgresql",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
});
