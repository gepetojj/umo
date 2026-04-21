import { ReactNode } from "react";
import { pretty, render, toPlainText } from "react-email";

import { env } from "@/server/env";

type SendEmailProps = {
	from: string;
	to: string;
	subject: string;
	react: ReactNode;
};

export async function sendEmail({ from, to, subject, react }: SendEmailProps) {
	const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_EMAIL_API_KEY } = env;

	const html = await render(react);
	const text = toPlainText(html);
	const prettyHtml = await pretty(html);

	const res = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/email/sending/send`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${CLOUDFLARE_EMAIL_API_KEY}`,
			},
			body: JSON.stringify({
				from: from,
				to: to,
				subject: subject,
				html: prettyHtml,
				text,
			}),
		},
	);

	if (!res.ok) {
		const json = await res.json();
		console.error(`Failed to send email to ${to}:`, json);
		throw new Error(`Failed to send email to ${to}`);
	}
}
