"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { workspaceBriefQueryKey } from "@/hooks/use-workspace-brief";
import { acceptWorkspaceInviteAction } from "@/server/actions/workspace/accept-invite.action";
import { validateWorkspaceInviteAction } from "@/server/actions/workspace/validate-workspace-invite.action";

type Props = { token: string };

export function WorkspaceJoinClient({ token }: Props) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { isSignedIn } = useAuth();
	const [valid, setValid] = useState<boolean | null>(null);
	const [hint, setHint] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const validate = useCallback(async () => {
		const r = await validateWorkspaceInviteAction({ token });
		if (r.serverError) {
			setValid(false);
			return;
		}
		if (r.data?.valid) {
			setValid(true);
			setHint(r.data.emailHint ?? null);
		} else {
			setValid(false);
		}
	}, [token]);

	useEffect(() => {
		void validate();
	}, [validate]);

	const onAccept = async () => {
		setBusy(true);
		setError(null);
		const r = await acceptWorkspaceInviteAction({ token });
		if (r.serverError) {
			setError(r.serverError);
			setBusy(false);
			return;
		}
		await queryClient.invalidateQueries({
			queryKey: workspaceBriefQueryKey,
		});
		router.push("/workspace");
		router.refresh();
	};

	if (valid === null) {
		return (
			<div className="flex flex-1 items-center justify-center p-8">
				<Spinner className="size-8" />
			</div>
		);
	}

	if (!valid) {
		return (
			<div className="mx-auto max-w-md flex-1 p-8 text-center">
				<h1 className="font-semibold text-xl">
					Convite inválido ou expirado
				</h1>
				<p className="mt-2 text-muted-foreground text-sm">
					Peça um novo convite ao titular do workspace.
				</p>
				<Button asChild className="mt-6">
					<Link href="/">Ir ao início</Link>
				</Button>
			</div>
		);
	}

	if (!isSignedIn) {
		return (
			<div className="mx-auto max-w-md flex-1 p-8 text-center">
				<h1 className="font-semibold text-2xl">
					Convite para o workspace
				</h1>
				{hint ? (
					<p className="mt-3 text-muted-foreground text-sm">
						Convite enviado para <strong>{hint}</strong>. Entre com
						a conta desse e-mail para aceitar.
					</p>
				) : null}
				<SignInButton
					mode="modal"
					forceRedirectUrl={`/workspace/join/${token}`}
				>
					<Button size="lg" className="mt-8">
						Entrar para aceitar
					</Button>
				</SignInButton>
				<Button variant="ghost" asChild className="mt-3 block w-full">
					<Link href="/">Cancelar</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-md flex-1 p-8 text-center">
			<h1 className="font-semibold text-2xl">Convite para o workspace</h1>
			{hint ? (
				<p className="mt-3 text-muted-foreground text-sm">
					Convite enviado para <strong>{hint}</strong>. Use a conta
					com esse e-mail para entrar.
				</p>
			) : null}
			{error ? (
				<p role="alert" className="mt-4 text-destructive text-sm">
					{error}
				</p>
			) : null}
			<div className="mt-8 flex flex-col gap-3">
				<Button
					size="lg"
					disabled={busy}
					onClick={() => void onAccept()}
				>
					{busy ? (
						<Spinner className="size-4" />
					) : (
						"Entrar no workspace"
					)}
				</Button>
				<Button variant="ghost" asChild>
					<Link href="/workspace">Cancelar</Link>
				</Button>
			</div>
		</div>
	);
}
