import { currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SubscribeSuccessContent } from "@/components/billing/subscribe-success-content";

export const metadata: Metadata = {
	title: "Bem-vindo ao umo",
	description: "Sua assinatura foi confirmada.",
};

export default async function SubscribeSuccessPage() {
	const clerkUser = await currentUser();
	if (!clerkUser) redirect("/sign-in");

	const firstName = clerkUser.firstName?.trim();
	const greetingName = firstName || null;

	return <SubscribeSuccessContent firstName={greetingName} />;
}
