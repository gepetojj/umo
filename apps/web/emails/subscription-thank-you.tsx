import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	pixelBasedPreset,
	Section,
	Tailwind,
	Text,
} from "react-email";

import type { PlanId } from "@/lib/plans";

export type SubscriptionThankYouEmailProps = {
	firstName: string;
	planId: PlanId;
	planName: string;
	planTagline: string;
	features: string[];
	dashboardUrl: string;
};

export default function SubscriptionThankYouEmail({
	firstName,
	planId,
	planName,
	planTagline,
	features,
	dashboardUrl,
}: SubscriptionThankYouEmailProps) {
	const isGold = planId === "gold";

	return (
		<Html lang="pt-BR">
			<Tailwind
				config={{
					presets: [pixelBasedPreset],
					theme: {
						extend: {
							colors: {
								ink: "#0c1222",
								muted: "#5c6578",
								cream: "#faf8f4",
								sand: "#f0ebe3",
								gold: "#b8953c",
								golddeep: "#8a6f2a",
								ivory: "#fffefb",
							},
						},
					},
				}}
			>
				<Head />
				<Body className="bg-cream font-sans text-ink">
					<Preview>
						{`Obrigado por assinar o Umo — você está no plano ${planName}.`}
					</Preview>
					<Container className="mx-auto max-w-[600px] px-[24px] py-[40px]">
						<Section className="rounded-[16px] border border-sand border-solid bg-ivory px-[40px] py-[36px] shadow-sm">
							<Text className="m-0 mb-[8px] font-semibold text-[12px] text-gold uppercase tracking-[0.2em]">
								Acesso confirmado
							</Text>
							<Heading className="m-0 mb-[16px] font-semibold text-[28px] text-ink leading-[36px]">
								{firstName}, você faz parte de algo especial
							</Heading>
							<Text className="m-0 mb-[24px] text-[16px] text-muted leading-[26px]">
								Obrigado por confiar no Umo. Sua assinatura está
								ativa e cada detalhe foi pensado para que você
								sinta exclusividade no jeito de capturar e
								revisitar o que importa nas suas reuniões.
							</Text>
							<Section
								className={`mb-[28px] rounded-[12px] border border-solid px-[24px] py-[20px] ${
									isGold
										? "border-gold/40 bg-[#fdf9ef]"
										: "border-sand bg-sand/40"
								}`}
							>
								<Text className="m-0 mb-[4px] font-semibold text-[11px] text-golddeep uppercase tracking-[0.16em]">
									Seu plano
								</Text>
								<Text className="m-0 mb-[8px] font-semibold text-[22px] text-ink">
									{planName}
								</Text>
								<Text className="m-0 text-[15px] text-muted leading-[24px]">
									{planTagline}
								</Text>
							</Section>
							<Text className="m-0 mb-[12px] font-medium text-[15px] text-ink">
								O que desbloqueamos para você:
							</Text>
							{features.slice(0, 4).map((line) => (
								<Text
									key={line}
									className="m-0 mb-[8px] pl-[12px] text-[15px] text-muted leading-[24px]"
								>
									<span className="text-gold">
										{"\u2022"}
									</span>
									<span className="ml-[8px]">{line}</span>
								</Text>
							))}
							<Hr className="my-[28px] border-0 border-sand border-t border-solid" />
							<Section className="text-center">
								<Button
									href={dashboardUrl}
									className="box-border inline-block rounded-[10px] bg-ink px-[28px] py-[14px] font-semibold text-[15px] text-ivory no-underline"
								>
									Entrar no Umo
								</Button>
							</Section>
							<Text className="mt-[24px] mb-0 text-center text-[13px] text-muted leading-[20px]">
								Se o botão não funcionar, copie e cole este link
								no navegador:
								<br />
								<span className="break-all text-golddeep">
									{dashboardUrl}
								</span>
							</Text>
						</Section>
						<Text className="mt-[28px] text-center text-[12px] text-muted">
							Umo — transcrição e resumos com clareza, para você e
							sua equipe.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

SubscriptionThankYouEmail.PreviewProps = {
	firstName: "Marina",
	planId: "gold",
	planName: "Gold",
	planTagline:
		"Para equipes que precisam de um espaço único, convites e prioridade.",
	features: [
		"Workspace de equipe por convite",
		"Transcrição e resumos com IA",
		"Histórico compartilhado no workspace",
	],
	dashboardUrl: "https://example.com/",
} satisfies SubscriptionThankYouEmailProps;
