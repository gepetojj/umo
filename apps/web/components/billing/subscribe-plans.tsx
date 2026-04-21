"use client";

import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { PlanPriceDisplay } from "@/lib/billing/fetch-plan-prices";
import type { PlanDefinition, PlanId } from "@/lib/plans";
import type { BillingOverviewClient } from "@/lib/subscriptions/billing-overview";
import { changeSubscriptionPlanAction } from "@/server/actions/billing/change-subscription-plan.action";
import { createCheckoutSessionAction } from "@/server/actions/billing/create-checkout-session.action";

type SubscribePlansProps = {
	overview: BillingOverviewClient;
	planPrices: Partial<Record<PlanId, PlanPriceDisplay>>;
};

export function SubscribePlans({ overview, planPrices }: SubscribePlansProps) {
	const router = useRouter();
	const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);
	const [error, setError] = useState<string | null>(null);

	const active = overview.activeSubscription;

	const runCheckout = useCallback(async (planId: PlanId) => {
		setPendingPlan(planId);
		setError(null);
		const result = await createCheckoutSessionAction({ planId });
		if (result.serverError) {
			setError(result.serverError);
			setPendingPlan(null);
			return;
		}
		if (result.data?.url) {
			window.location.href = result.data.url;
			return;
		}
		setError("Não foi possível continuar. Tente de novo.");
		setPendingPlan(null);
	}, []);

	const runChangePlan = useCallback(
		async (planId: PlanId) => {
			setPendingPlan(planId);
			setError(null);
			const result = await changeSubscriptionPlanAction({ planId });
			if (result.serverError) {
				setError(result.serverError);
				setPendingPlan(null);
				return;
			}
			setPendingPlan(null);
			router.refresh();
		},
		[router],
	);

	const resolveCta = (plan: PlanDefinition) => {
		if (!active) {
			return {
				kind: "checkout" as const,
				label: "Assinar agora",
				disabled: false,
			};
		}
		if (active.plan === plan.id) {
			return {
				kind: "current" as const,
				label: "Seu plano atual",
				disabled: true,
			};
		}
		if (active.plan === "starter" && plan.id === "gold") {
			return {
				kind: "change" as const,
				label: "Fazer upgrade para Gold",
				disabled: false,
			};
		}
		if (active.plan === "gold" && plan.id === "starter") {
			return {
				kind: "change" as const,
				label: "Mudar para o plano Starter",
				disabled: false,
			};
		}
		return {
			kind: "checkout" as const,
			label: "Assinar agora",
			disabled: false,
		};
	};

	const onPlanClick = (plan: PlanDefinition) => {
		const cta = resolveCta(plan);
		if (cta.kind === "current" || cta.disabled) return;
		if (cta.kind === "checkout") {
			void runCheckout(plan.id);
			return;
		}
		void runChangePlan(plan.id);
	};

	return (
		<div className="relative min-h-full overflow-auto">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.75_0.12_280/0.25),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.45_0.15_280/0.35),transparent)]" />
			<div className="relative mx-auto flex max-w-5xl flex-col gap-12 px-4 py-12 pb-24 sm:px-6">
				<div className="flex flex-col gap-4 text-center sm:text-left">
					<div className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-border/80 bg-background/80 px-3 py-1 text-muted-foreground text-xs shadow-sm backdrop-blur sm:self-start">
						<Sparkles className="size-3.5 text-amber-500" />
						Pagamento seguro · cobrança mensal
					</div>
					<h1 className="text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
						Escolha o plano ideal para as suas reuniões
					</h1>
					<p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground sm:mx-0">
						Transcrição inteligente, resumos e histórico organizado.
						Cancele quando quiser — sem complicação.
					</p>
					{overview.canUpgrade ? (
						<p className="mx-auto max-w-2xl rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-amber-950 text-sm sm:mx-0 dark:bg-amber-500/10 dark:text-amber-50">
							Você está no <strong>Starter</strong> (uso
							individual). O <strong>Gold</strong> inclui um
							workspace para equipe com até cinco pessoas no preço
							base, convites e prioridade no suporte.
						</p>
					) : null}
					<div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
						<Button variant="outline" size="sm" asChild>
							<Link href="/billing">Minha assinatura</Link>
						</Button>
					</div>
				</div>

				{error ? (
					<div
						role="alert"
						className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive text-sm"
					>
						{error}
					</div>
				) : null}

				<div className="grid gap-6 md:grid-cols-2 md:items-stretch">
					{overview.plans.map((plan) => {
						const cta = resolveCta(plan);
						const isGold = plan.highlighted;
						const busy = pendingPlan === plan.id;
						const price = planPrices[plan.id];

						return (
							<div
								key={plan.id}
								className={
									isGold
										? "relative flex flex-col rounded-2xl border-2 border-amber-400/50 bg-linear-to-b from-amber-50/90 to-card p-6 shadow-xl ring-1 ring-amber-400/20 dark:border-amber-500/40 dark:from-amber-950/40 dark:to-card"
										: "relative flex flex-col rounded-2xl border border-border/80 bg-card/90 p-6 shadow-md backdrop-blur"
								}
							>
								{isGold ? (
									<span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 font-medium text-[0.7rem] text-white uppercase tracking-wide shadow">
										Mais popular
									</span>
								) : null}
								<div className="mb-2 flex flex-col gap-2">
									<h2 className="font-semibold text-2xl tracking-tight">
										{plan.name}
									</h2>
									<p className="text-muted-foreground text-sm leading-relaxed">
										{plan.tagline}
									</p>
									<div className="mt-3 border-border/60 border-t pt-4">
										{price ? (
											<div>
												<p className="font-semibold text-3xl tabular-nums tracking-tight">
													{price.formattedAmount}
													<span className="font-normal text-lg text-muted-foreground">
														{" "}
														{price.billingCadence}
													</span>
												</p>
												<p className="mt-1 text-muted-foreground text-xs">
													Cobrança recorrente; cancele
													quando quiser.
												</p>
											</div>
										) : (
											<p className="font-medium text-foreground text-sm">
												{plan.priceLabel}
											</p>
										)}
									</div>
								</div>
								<ul className="mb-6 flex flex-1 flex-col gap-3 pt-2">
									{plan.features.map((f) => (
										<li
											key={f}
											className="flex gap-2 text-muted-foreground text-sm leading-snug"
										>
											<Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
											<span>{f}</span>
										</li>
									))}
								</ul>
								<Button
									size="lg"
									className="w-full rounded-xl"
									variant={
										cta.kind === "current"
											? "secondary"
											: "default"
									}
									disabled={cta.kind === "current" || busy}
									onClick={() => onPlanClick(plan)}
								>
									{busy ? (
										<>
											<Spinner className="mr-2 size-4" />
											Processando…
										</>
									) : (
										cta.label
									)}
								</Button>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
