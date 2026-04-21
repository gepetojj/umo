import { headers } from "next/headers";
import type Stripe from "stripe";

import { syncSubscriptionFromStripe } from "@/lib/subscriptions/sync-subscription-from-stripe";
import { tryCatch } from "@/lib/try";
import { env } from "@/server/env";
import { stripe } from "@/server/stripe";

export async function POST(req: Request) {
	const { STRIPE_WEBHOOK_SECRET } = env;

	const headerPayload = await headers();
	const signature = headerPayload.get("stripe-signature");

	if (!signature) {
		return new Response("Missing stripe-signature", { status: 400 });
	}

	const payload = await req.text();
	if (!payload) {
		return new Response("Missing payload", { status: 400 });
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
		return new Response("Invalid signature", { status: 400 });
	}

	try {
		switch (event.type) {
			case "customer.subscription.created":
			case "customer.subscription.updated":
			case "customer.subscription.deleted": {
				await syncSubscriptionFromStripe(
					event.data.object as Stripe.Subscription,
				);
				break;
			}

			case "checkout.session.completed": {
				const session = event.data.object as Stripe.Checkout.Session;
				if (session.mode !== "subscription" || !session.subscription) {
					break;
				}
				const subId =
					typeof session.subscription === "string"
						? session.subscription
						: session.subscription.id;
				const full = await stripe.subscriptions.retrieve(subId);
				await syncSubscriptionFromStripe(full);
				break;
			}

			default: {
				console.error(`[stripe] Unhandled event type: ${event.type}`);
				break;
			}
		}
	} catch (err) {
		console.error("[stripe] Webhook handler error:", err);
		return new Response("Webhook handler failed", { status: 500 });
	}

	return new Response(null, { status: 200 });
}
