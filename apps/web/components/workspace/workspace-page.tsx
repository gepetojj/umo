"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { workspaceBriefQueryKey } from "@/hooks/use-workspace-brief";
import { getWorkspaceDashboardAction } from "@/server/actions/workspace/get-workspace-dashboard.action";
import { getWorkspaceMeetingsByMemberAction } from "@/server/actions/workspace/get-workspace-meetings-by-member.action";
import { inviteWorkspaceMemberAction } from "@/server/actions/workspace/invite-member.action";
import { leaveWorkspaceAction } from "@/server/actions/workspace/leave-workspace.action";
import { removeWorkspaceMemberAction } from "@/server/actions/workspace/remove-member.action";

type Dashboard = NonNullable<
	Awaited<ReturnType<typeof getWorkspaceDashboardAction>>["data"]
>;

export function WorkspacePage() {
	const queryClient = useQueryClient();
	const [dash, setDash] = useState<Dashboard | null>(null);
	const [loading, setLoading] = useState(true);
	const [meetingsByMember, setMeetingsByMember] = useState<NonNullable<
		Awaited<ReturnType<typeof getWorkspaceMeetingsByMemberAction>>["data"]
	> | null>(null);
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const [inviteLink, setInviteLink] = useState<string | null>(null);

	const load = useCallback(async () => {
		setError(null);
		const r = await getWorkspaceDashboardAction();
		if (r.serverError) {
			setError(r.serverError);
			setDash(null);
			setLoading(false);
			return;
		}
		setDash(r.data ?? null);
		setLoading(false);
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const loadOwnerMeetings = useCallback(async () => {
		const r = await getWorkspaceMeetingsByMemberAction();
		if (!r.serverError && r.data) setMeetingsByMember(r.data);
	}, []);

	useEffect(() => {
		if (dash?.role === "owner") void loadOwnerMeetings();
	}, [dash, loadOwnerMeetings]);

	const onInvite = async () => {
		setPending(true);
		setError(null);
		setInviteLink(null);
		const r = await inviteWorkspaceMemberAction({ email });
		if (r.serverError) {
			setError(r.serverError);
			setPending(false);
			return;
		}
		if (r.data?.joinUrl) setInviteLink(r.data.joinUrl);
		setEmail("");
		setPending(false);
		void queryClient.invalidateQueries({
			queryKey: workspaceBriefQueryKey,
		});
		void load();
	};

	const onRemove = async (memberUserId: string) => {
		setPending(true);
		setError(null);
		const r = await removeWorkspaceMemberAction({ memberUserId });
		if (r.serverError) setError(r.serverError);
		setPending(false);
		void queryClient.invalidateQueries({
			queryKey: workspaceBriefQueryKey,
		});
		void load();
		void loadOwnerMeetings();
	};

	const onLeave = async () => {
		setPending(true);
		setError(null);
		const r = await leaveWorkspaceAction();
		if (r.serverError) setError(r.serverError);
		setPending(false);
		void queryClient.invalidateQueries({
			queryKey: workspaceBriefQueryKey,
		});
		void load();
	};

	if (loading) {
		return (
			<div className="flex flex-1 items-center justify-center p-8">
				<Spinner className="size-8" />
			</div>
		);
	}

	if (!dash) {
		return (
			<div className="mx-auto max-w-lg flex-1 p-8">
				<h1 className="font-semibold text-2xl">Workspace</h1>
				<p className="mt-2 text-muted-foreground">
					Equipe compartilhada e convites estão disponíveis no plano
					Gold.
				</p>
				<Button asChild className="mt-6">
					<Link href="/subscribe">Ver planos</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="mx-auto flex max-w-3xl flex-1 flex-col gap-8 overflow-auto p-6">
			<div>
				<h1 className="font-semibold text-2xl tracking-tight">
					Workspace
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Convide colegas pelo e-mail e compartilhe reuniões da
					equipe. Vagas extras são cobradas automaticamente após as
					cinco primeiras.
				</p>
			</div>

			{error ? (
				<div
					role="alert"
					className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive text-sm"
				>
					{error}
				</div>
			) : null}

			<section>
				<h2 className="mb-3 flex items-center gap-2 font-medium text-sm">
					<Users className="size-4" />
					Pessoas ({dash.members.length})
				</h2>
				<ul className="divide-y rounded-xl border">
					{dash.members.map((m) => (
						<li
							key={m.userId}
							className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
						>
							<div>
								<p className="font-medium">{m.fullName}</p>
								<p className="text-muted-foreground">
									{m.email}
								</p>
								<p className="text-muted-foreground text-xs capitalize">
									{m.role === "owner" ? "Titular" : "Membro"}
								</p>
							</div>
							{dash.role === "owner" &&
							m.role !== "owner" &&
							!pending ? (
								<Button
									variant="outline"
									size="sm"
									onClick={() => void onRemove(m.userId)}
								>
									Remover
								</Button>
							) : null}
						</li>
					))}
				</ul>
			</section>

			{dash.role === "member" ? (
				<Button variant="secondary" onClick={() => void onLeave()}>
					Sair do workspace
				</Button>
			) : null}

			{dash.role === "owner" ? (
				<>
					<section>
						<h2 className="mb-3 font-medium text-sm">
							Convidar por e-mail
						</h2>
						<div className="flex flex-col gap-3 sm:flex-row">
							<Input
								type="email"
								placeholder="colega@empresa.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="flex-1"
							/>
							<Button
								onClick={() => void onInvite()}
								disabled={pending || !email.includes("@")}
							>
								{pending ? (
									<Spinner className="size-4" />
								) : (
									"Gerar link"
								)}
							</Button>
						</div>
						{inviteLink ? (
							<p className="wrap-break-word mt-3 rounded-lg bg-muted p-3 font-mono text-xs">
								{inviteLink}
							</p>
						) : (
							<p className="mt-2 text-muted-foreground text-xs">
								Envie o link gerado por qualquer canal. Quem
								receber deve entrar com a mesma conta do e-mail
								convidado.
							</p>
						)}
					</section>

					{dash.role === "owner" && dash.invitations.length > 0 ? (
						<section>
							<h2 className="mb-2 font-medium text-sm">
								Convites pendentes
							</h2>
							<ul className="text-muted-foreground text-sm">
								{dash.invitations.map((i) => (
									<li key={i.id}>{i.email}</li>
								))}
							</ul>
						</section>
					) : null}

					<Separator />

					<section>
						<h2 className="mb-3 font-medium text-sm">
							Reuniões compartilhadas por pessoa
						</h2>
						{meetingsByMember ? (
							<div className="space-y-6">
								{meetingsByMember.byMember.map(
									({ member, meetings }) => (
										<div key={member.userId}>
											<p className="font-medium text-sm">
												{member.fullName}
											</p>
											<ul className="mt-2 space-y-1">
												{meetings.length === 0 ? (
													<li className="text-muted-foreground text-sm">
														Nenhuma reunião
														compartilhada ainda.
													</li>
												) : (
													meetings.map((meet) => (
														<li key={meet.id}>
															<Link
																href={`/m/${meet.id}`}
																className="text-primary text-sm underline-offset-4 hover:underline"
															>
																{meet.title ||
																	"Sem título"}
															</Link>
															<span className="ml-2 text-muted-foreground text-xs">
																{new Date(
																	meet.createdAt,
																).toLocaleDateString(
																	"pt-BR",
																)}
															</span>
														</li>
													))
												)}
											</ul>
										</div>
									),
								)}
							</div>
						) : (
							<Spinner className="size-6" />
						)}
					</section>
				</>
			) : null}
		</div>
	);
}
