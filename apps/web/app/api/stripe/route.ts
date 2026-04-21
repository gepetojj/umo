import { headers } from "next/headers";

import { stripe } from "@/lib/stripe";
import { tryCatch } from "@/lib/try";
import { env } from "@/server/env";

export const config = {
	api: {
		bodyParser: false,
	},
};

export async function POST(req: Request) {
	const { STRIPE_WEBHOOK_SECRET } = env;

	const headerPayload = await headers();
	const signature = headerPayload.get("stripe-signature");

	if (!signature) {
		return new Response("Error occured -- no stripe signature", {
			status: 400,
		});
	}

	const payload = await req.text();
	if (!payload) {
		return new Response("Error occured -- no payload", {
			status: 400,
		});
	}

	const [event, eventParsingError] = await tryCatch(
		stripe.webhooks.constructEvent(
			payload,
			signature,
			STRIPE_WEBHOOK_SECRET,
		),
	);
	if (eventParsingError) {
		console.error(`[stripe] Error parsing event:`, eventParsingError);
		return new Response("Error occured -- failed to parse event", {
			status: 400,
		});
	}

	switch (event.type) {
		case "customer.subscription.created": {
			const _subscription = event.data.object;
			break;
		}

		case "customer.subscription.updated": {
			const _subscription = event.data.object;
			break;
		}

		case "customer.subscription.deleted": {
			const _subscription = event.data.object;
			break;
		}

		default: {
			return new Response("Error occured -- unknown event type", {
				status: 406,
			});
		}
	}

	return new Response("OK", { status: 200 });
}
