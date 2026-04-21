"use client";

import {
	ArrowUpRight,
	ChevronRight,
	CreditCard,
	LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type { BillingOverviewClient } from "@/lib/subscriptions/billing-overview";
import { subscriptionStatusLabelPt } from "@/lib/subscriptions/subscription-copy";
import { createCustomerPortalSessionAction } from "@/server/actions/billing/create-customer-portal-session.action";

type BillingOverviewPanelProps = {
	overview: BillingOverviewClient;
};

function formatDate(iso: string) {
	return new Intl.DateTimeFormat("pt-BR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(new Date(iso));
}

export function BillingOverviewPanel({ overview }: BillingOverviewPanelProps) {
	const [portalPending, setPortalPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const display = overview.displaySubscription;
	const active = overview.activeSubscription;

	const planName =
		overview.plans.find((p) => p.id === display?.plan)?.name ?? "—";

	const openPortal = useCallback(async () => {
		setPortalPending(true);
		setError(null);
		const result = await createCustomerPortalSessionAction();
		if (result.serverError) {
			setError(result.serverError);
			setPortalPending(false);
			return;
		}
		if (result.data?.url) {
			window.location.href = result.data.url;
			return;
		}
		setError("Não foi possível abrir a área de pagamentos. Tente de novo.");
		setPortalPending(false);
	}, []);

	return (
		<div className="relative min-h-full overflow-auto">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_100%_0%,oklch(0.7_0.08_250/0.2),transparent)]" />
			<div className="relative mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 pb-20 sm:px-6">
				<div>
					<h1 className="font-semibold text-3xl tracking-tight">
						Minha assinatura
					</h1>
					<p className="mt-2 text-muted-foreground">
						Veja seu plano, próximas datas e ajuste pagamento quando
						precisar.
					</p>
				</div>

				{error ? (
					<div
						role="alert"
						className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive text-sm"
					>
						{error}
					</div>
				) : null}

				<div className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-lg backdrop-blur">
					<div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
						<div className="space-y-3">
							<div className="flex flex-wrap items-center gap-2">
								<span className="rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
									Plano
								</span>
								<span className="font-semibold text-2xl">
									{planName}
								</span>
							</div>
							{display ? (
								<dl className="grid gap-2 text-sm">
									<div className="flex flex-wrap gap-x-2">
										<dt className="text-muted-foreground">
											Status
										</dt>
										<dd className="font-medium">
											{subscriptionStatusLabelPt(
												display.status,
											)}
										</dd>
									</div>
									<div className="flex flex-wrap gap-x-2">
										<dt className="text-muted-foreground">
											{active
												? "Próxima renovação"
												: "Fim do período atual"}
										</dt>
										<dd className="font-medium">
											{formatDate(display.periodEnd)}
										</dd>
									</div>
									<div className="flex flex-wrap gap-x-2">
										<dt className="text-muted-foreground">
											Início do período
										</dt>
										<dd className="font-medium">
											{formatDate(display.periodStart)}
										</dd>
									</div>
								</dl>
							) : (
								<p className="text-muted-foreground text-sm">
									Nenhuma assinatura ainda. Escolha um plano
									para liberar o acesso completo ao umo.
								</p>
							)}
						</div>
						<div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[220px]">
							<Button
								size="lg"
								className="w-full justify-between rounded-xl"
								onClick={() => void openPortal()}
								disabled={portalPending}
							>
								<span className="flex items-center gap-2">
									{portalPending ? (
										<Spinner className="size-4" />
									) : (
										<CreditCard className="size-4" />
									)}
									Pagamentos e recibos
								</span>
								<ChevronRight className="size-4 opacity-70" />
							</Button>
							<p className="text-muted-foreground text-xs leading-relaxed">
								Atualize seu cartão, baixe recibos e altere ou
								cancele sua assinatura.
							</p>
						</div>
					</div>

					<Separator className="my-6" />

					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-2 text-sm">
							<LayoutGrid className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
							<div>
								<p className="font-medium">Trocar de plano</p>
								<p className="text-muted-foreground">
									Compare benefícios e faça upgrade ou ajuste
									o plano em um só lugar.
								</p>
							</div>
						</div>
						<Button
							variant="secondary"
							className="rounded-xl"
							asChild
						>
							<Link href="/subscribe" className="gap-2">
								Ver planos
								<ArrowUpRight className="size-4" />
							</Link>
						</Button>
					</div>
				</div>

				<p className="text-center text-muted-foreground text-xs sm:text-left">
					Após cada cobrança, enviamos um comprovante para o seu
					e-mail.
				</p>
			</div>
		</div>
	);
}
