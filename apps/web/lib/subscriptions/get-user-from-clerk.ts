import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { usersTable } from "@/server/db/schema/users";

export async function getUserFromClerk(clerkId: string) {
	const [user] = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.clerkId, clerkId))
		.limit(1);

	return user || null;
}
