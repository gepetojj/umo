import { createElement } from "react";

import WorkspaceInviteEmail from "@/emails/workspace-invite";
import { sendEmail } from "@/lib/email/send-email";
import { env } from "@/server/env";

export async function sendWorkspaceInviteEmail(input: {
	to: string;
	inviterName: string;
	inviterEmail: string;
	workspaceName: string;
	acceptInviteUrl: string;
}) {
	await sendEmail({
		from: env.TRANSACTIONAL_EMAIL_FROM,
		to: input.to,
		subject: `${input.inviterName} convidou você para o workspace no Umo`,
		react: createElement(WorkspaceInviteEmail, {
			inviterName: input.inviterName,
			inviterEmail: input.inviterEmail,
			workspaceName: input.workspaceName,
			acceptInviteUrl: input.acceptInviteUrl,
		}),
	});
}
