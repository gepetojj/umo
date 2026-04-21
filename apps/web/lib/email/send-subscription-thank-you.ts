import { createElement } from "react";

import SubscriptionThankYouEmail from "@/emails/subscription-thank-you";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { sendEmail } from "@/lib/email/send-email";
import { getPlanDefinitions, type PlanId } from "@/lib/plans";
import { env } from "@/server/env";

export async function sendSubscriptionThankYouEmail(input: {
	to: string;
	fullName: string;
	planId: PlanId;
}) {
	const plan = getPlanDefinitions().find((p) => p.id === input.planId);
	if (!plan) return;

	const first =
		input.fullName.trim().split(/\s+/)[0] || input.fullName.trim() || "Olá";

	await sendEmail({
		from: env.TRANSACTIONAL_EMAIL_FROM,
		to: input.to,
		subject: `Bem-vindo ao Umo — plano ${plan.name}`,
		react: createElement(SubscriptionThankYouEmail, {
			firstName: first,
			planId: input.planId,
			planName: plan.name,
			planTagline: plan.tagline,
			features: plan.features,
			dashboardUrl: getAppBaseUrl(),
		}),
	});
}
