/** Origin absoluto para redirecionamentos após pagamento (ex.: retorno da área de pagamentos). */
export function getAppBaseUrl(): string {
	const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
	if (explicit) return explicit.replace(/\/$/, "");
	const vercel = process.env.VERCEL_URL?.trim();
	if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
	return "http://localhost:3000";
}
