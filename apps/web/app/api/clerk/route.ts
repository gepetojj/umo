import { randomUUID } from "node:crypto";

import type { UserJSON, WebhookEvent } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { Webhook } from "svix";

import { db } from "@/server/db";
import { usersTable } from "@/server/db/schema/users";
import { env } from "@/server/env";

export async function POST(req: Request) {
	const { CLERK_WEBHOOK_SECRET } = env;

	const headerPayload = await headers();
	const svixId = headerPayload.get("svix-id");
	const svixTimestamp = headerPayload.get("svix-timestamp");
	const svixSignature = headerPayload.get("svix-signature");

	if (!svixId || !svixTimestamp || !svixSignature) {
		return new Response("Error occured -- no svix headers", {
			status: 400,
		});
	}

	const payload = await req.json();
	const body = JSON.stringify(payload);

	const wh = new Webhook(CLERK_WEBHOOK_SECRET);
	let evt: WebhookEvent;

	try {
		evt = wh.verify(body, {
			"svix-id": svixId,
			"svix-signature": svixSignature,
			"svix-timestamp": svixTimestamp,
		}) as WebhookEvent;
	} catch (err) {
		console.error("Error verifying webhook:", err);
		return new Response("Error occured", {
			status: 400,
		});
	}

	const type = evt.type;
	switch (type) {
		case "user.created":
		case "user.updated": {
			const data = {
				email:
					evt.data.email_addresses.find(
						(e) =>
							e.id ===
							(evt.data as UserJSON).primary_email_address_id,
					)?.email_address ||
					evt.data.email_addresses[0].email_address,
				clerkId: evt.data.id,
				fullName: `${evt.data.first_name} ${evt.data.last_name}`,
				avatarUrl: evt.data.image_url,
			};
			if (!data.fullName) {
				return new Response("Missing full name", {
					status: 400,
				});
			}

			try {
				if (evt.type === "user.created") {
					await db.insert(usersTable).values({
						id: randomUUID(),
						clerkId: data.clerkId,
						fullName: data.fullName,
						email: data.email,
						avatarUrl: data.avatarUrl,
					});
					break;
				}

				await db
					.update(usersTable)
					.set({
						fullName: data.fullName,
						email: data.email,
						avatarUrl: data.avatarUrl,
					})
					.where(eq(usersTable.clerkId, data.clerkId));
			} catch (err) {
				console.error("Error upserting user:", err);
				return new Response("Error occured", {
					status: 500,
				});
			}
			break;
		}

		case "user.deleted": {
			const clerkId = evt.data.id;

			if (!clerkId) {
				return new Response("Missing clerk ID", {
					status: 400,
				});
			}

			try {
				await db
					.delete(usersTable)
					.where(eq(usersTable.clerkId, clerkId));
			} catch (err) {
				console.error("Error deleting user:", err);
				return new Response("Error occured", {
					status: 500,
				});
			}
			break;
		}
	}

	return new Response("OK", { status: 200 });
}
