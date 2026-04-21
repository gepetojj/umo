"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type SubscribeSuccessContentProps = {
	firstName: string | null;
};

export function SubscribeSuccessContent({
	firstName,
}: SubscribeSuccessContentProps) {
	const headline = firstName
		? `${firstName}, você está dentro.`
		: "Você está dentro.";

	return (
		<div className="relative flex min-h-full flex-col overflow-auto">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,oklch(0.82_0.14_85/0.35),transparent)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,oklch(0.55_0.12_280/0.25),transparent)]" />
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_100%,oklch(0.75_0.1_300/0.2),transparent)]" />

			<div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-16 sm:px-6 sm:py-24">
				<div className="flex flex-col items-center text-center">
					<div
						className="mb-8 flex size-20 items-center justify-center rounded-3xl bg-linear-to-br from-amber-400/90 to-amber-600/95 shadow-[0_20px_60px_-15px_oklch(0.65_0.15_75/0.55)] ring-4 ring-amber-400/25 dark:from-amber-500/80 dark:to-amber-800/90 dark:ring-amber-500/20"
						aria-hidden
					>
						<Sparkles className="size-10 text-white drop-shadow-sm" />
					</div>

					<p className="mb-3 font-medium text-amber-800/90 text-sm uppercase tracking-[0.2em] dark:text-amber-200/90">
						Assinatura confirmada
					</p>

					<h1 className="max-w-lg text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
						{headline}
					</h1>

					<p className="mt-6 max-w-md text-pretty text-lg text-muted-foreground leading-relaxed">
						Obrigado por confiar no umo. A partir de agora você tem
						tudo o que preparamos para transformar reuniões em
						clareza — com a mesma atenção que reservamos para quem
						escolhe ir além do básico.
					</p>

					<p className="mt-4 max-w-md text-pretty text-muted-foreground text-sm leading-relaxed">
						Seja bem-vindo a um jeito mais calmo de acompanhar
						decisões, tarefas e contexto. Estamos felizes em ter
						você aqui.
					</p>

					<div className="mt-12 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
						<Button
							size="lg"
							className="h-12 rounded-xl text-base shadow-lg"
							asChild
						>
							<Link href="/" className="gap-2">
								Começar a usar o umo
								<ArrowRight className="size-4" />
							</Link>
						</Button>
						<Button
							size="lg"
							variant="outline"
							className="h-12 rounded-xl text-base"
							asChild
						>
							<Link href="/billing">Minha assinatura</Link>
						</Button>
					</div>

					<Link
						href="/subscribe"
						className="mt-10 text-muted-foreground text-sm underline-offset-4 transition-colors hover:text-foreground hover:underline"
					>
						Ver planos e benefícios
					</Link>
				</div>
			</div>
		</div>
	);
}
