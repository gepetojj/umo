export function subscriptionStatusLabelPt(status: string): string {
	const map: Record<string, string> = {
		active: "Ativa",
		trialing: "Em período de testes",
		canceled: "Cancelada",
		past_due: "Pagamento em atraso",
		unpaid: "Não paga",
		incomplete: "Incompleta",
		incomplete_expired: "Expirada",
		paused: "Pausada",
	};
	return map[status] ?? status;
}
