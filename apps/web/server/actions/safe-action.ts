import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { createSafeActionClient } from "next-safe-action";
import { ZodError } from "zod";

import { getActiveSubscription } from "@/lib/subscriptions/get-active-subscription";
import { db } from "@/server/db";
import { usersTable } from "@/server/db/schema/users";

export class AuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AuthError";
	}
}

export const actionClient = createSafeActionClient({
	handleServerError: (e) => {
		if (!(e instanceof ZodError) && !(e instanceof AuthError)) {
			console.error(e);
		}

		return e.message;
	},
});

export const authActionClient = actionClient.use(async ({ next }) => {
	const clerkUser = await currentUser();

	if (!clerkUser) throw new AuthError("Not logged in");
	if (clerkUser.banned) throw new AuthError("Banned");
	if (clerkUser.locked) throw new AuthError("Locked");

	const [user] = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.clerkId, clerkUser.id))
		.limit(1);
	// .$withCache({
	// 	config: { ex: 5 * 60 }, // 5 minutes
	// });
	if (!user) {
		// Esse caso não deve acontecer, por isso é um Error comum e não um AuthError
		throw new Error("User not found");
	}

	return next({
		ctx: {
			clerkUser,
			user,
		},
	});
});

export const paidActionClient = authActionClient.use(
	async ({ ctx: { user }, next }) => {
		const subscription = await getActiveSubscription(user.id);
		if (!subscription) throw new AuthError("No active subscription");

		return next({
			ctx: {
				subscription,
			},
		});
	},
);
