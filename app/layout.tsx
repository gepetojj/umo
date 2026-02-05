import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import clsx from "clsx/lite";

import { PWARegister } from "@/components/pwa-register";
import { QueryProvider } from "@/components/query-provider";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "umo",
	description: "Plataforma para transcrição e resumo automático de reuniões.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="pt-BR">
			<body
				className={clsx(
					geistSans.variable,
					geistMono.variable,
					"antialiased",
				)}
			>
				<PWARegister />
				<QueryProvider>{children}</QueryProvider>
			</body>
		</html>
	);
}
