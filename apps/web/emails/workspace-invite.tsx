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

export type WorkspaceInviteEmailProps = {
	inviterName: string;
	inviterEmail: string;
	workspaceName: string;
	acceptInviteUrl: string;
};

export default function WorkspaceInviteEmail({
	inviterName,
	inviterEmail,
	workspaceName,
	acceptInviteUrl,
}: WorkspaceInviteEmailProps) {
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
								sand: "#e8e2d8",
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
						{`${inviterName} convidou você para o workspace ${workspaceName} no Umo.`}
					</Preview>
					<Container className="mx-auto max-w-[600px] px-[24px] py-[40px]">
						<Section className="rounded-[16px] border border-sand border-solid bg-ivory px-[40px] py-[36px] shadow-sm">
							<Text className="m-0 mb-[8px] font-semibold text-[12px] text-gold uppercase tracking-[0.2em]">
								Convite para workspace
							</Text>
							<Heading className="m-0 mb-[20px] font-semibold text-[26px] text-ink leading-[34px]">
								Você foi convidado para colaborar
							</Heading>
							<Section className="mb-[28px] rounded-[12px] border border-sand border-solid bg-[#f7f4ee] px-[22px] py-[18px]">
								<Text className="m-0 mb-[6px] font-medium text-[13px] text-muted uppercase tracking-wide">
									Quem convidou
								</Text>
								<Text className="m-0 font-semibold text-[18px] text-ink">
									{inviterName}
								</Text>
								<Text className="m-0 mt-[4px] text-[14px] text-muted">
									{inviterEmail}
								</Text>
							</Section>
							<Text className="m-0 mb-[8px] text-[15px] text-muted leading-[24px]">
								Você entrou na lista de convites do workspace:
							</Text>
							<Text className="m-0 mb-[24px] font-semibold text-[20px] text-ink">
								{workspaceName}
							</Text>
							<Text className="m-0 mb-[28px] text-[15px] text-muted leading-[24px]">
								Ao aceitar, você passa a ver reuniões e
								conteúdos compartilhados neste espaço no Umo. O
								convite vale por 7 dias.
							</Text>
							<Hr className="my-[28px] border-0 border-sand border-t border-solid" />
							<Section className="text-center">
								<Button
									href={acceptInviteUrl}
									className="box-border inline-block rounded-[10px] bg-ink px-[28px] py-[14px] font-semibold text-[15px] text-ivory no-underline"
								>
									Aceitar convite
								</Button>
							</Section>
							<Text className="mt-[24px] mb-0 text-center text-[13px] text-muted leading-[20px]">
								Se o botão não funcionar, copie e cole este link
								no navegador:
								<br />
								<span className="break-all text-golddeep">
									{acceptInviteUrl}
								</span>
							</Text>
						</Section>
						<Text className="mt-[28px] text-center text-[12px] text-muted">
							Umo — reuniões com contexto, para times que decidem
							junto.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

WorkspaceInviteEmail.PreviewProps = {
	inviterName: "Ricardo Alves",
	inviterEmail: "ricardo@empresa.com",
	workspaceName: "Produto & Design",
	acceptInviteUrl: "https://example.com/workspace/join/abc123",
} satisfies WorkspaceInviteEmailProps;
