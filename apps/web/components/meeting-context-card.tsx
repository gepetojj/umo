"use client";

import {
	AlertCircleIcon,
	CheckCircle2Icon,
	CircleIcon,
	CircleX,
} from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import type { MeetingForDisplay } from "@/lib/meetings";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number) {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

type StepStatus = "done" | "in_progress" | "pending" | "failed" | "cancelled";

const STEP_CONFIG = [
	{ key: "recording", label: "Gravação", status: "done" as StepStatus },
	{
		key: "transcription",
		label: "Transcrição",
		status: "in_progress" as StepStatus,
	},
	{
		key: "summary",
		label: "Resumo e análises",
		status: "pending" as StepStatus,
	},
] as const;

function StepIndicator({ status }: { status: StepStatus }) {
	if (status === "done") {
		return (
			<CheckCircle2Icon
				className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
				aria-hidden
			/>
		);
	}
	if (status === "failed") {
		return (
			<AlertCircleIcon
				className="size-4 shrink-0 text-destructive"
				aria-hidden
			/>
		);
	}
	if (status === "cancelled") {
		return (
			<CircleX
				className="size-4 shrink-0 text-muted-foreground/50"
				aria-hidden
			/>
		);
	}
	if (status === "in_progress") {
		return (
			<Spinner
				className="size-4 shrink-0 text-amber-600 dark:text-amber-400"
				aria-label="Em progresso"
			/>
		);
	}
	return (
		<CircleIcon
			className="size-4 shrink-0 text-muted-foreground/40"
			aria-hidden
		/>
	);
}

function stepRowBg(status: StepStatus) {
	if (status === "done") return "bg-emerald-500/8 dark:bg-emerald-500/10";
	if (status === "failed") return "bg-destructive/8 dark:bg-destructive/10";
	if (status === "in_progress") return "bg-amber-500/8 dark:bg-amber-500/10";
	if (status === "cancelled") return "";
	return "";
}

interface MeetingContextCardProps {
	meeting: MeetingForDisplay;
	audioUrl: string | null;
	recordingFailed?: boolean;
	compact?: boolean;
	className?: string;
}

export function MeetingContextCard({
	meeting,
	audioUrl,
	recordingFailed = false,
	compact = false,
	className,
}: MeetingContextCardProps) {
	const title = meeting.title || "Reunião sem título";

	function getStepStatus(
		stepKey: string,
		defaultStatus: StepStatus,
	): StepStatus {
		if (stepKey === "recording" && recordingFailed) return "failed";
		if (
			recordingFailed &&
			(stepKey === "transcription" || stepKey === "summary")
		)
			return "cancelled";
		return defaultStatus;
	}

	return (
		<section
			aria-label="Contexto da reunião"
			className={cn(
				"flex flex-col",
				compact ? "gap-3" : "gap-5",
				className,
			)}
		>
			<div className="flex flex-col gap-1">
				<h2
					className={cn(
						"font-semibold text-foreground leading-tight tracking-tight",
						compact ? "text-lg" : "text-2xl",
					)}
				>
					{title}
				</h2>
				<p
					className={cn(
						"text-muted-foreground tabular-nums",
						compact ? "text-xs" : "text-sm",
					)}
				>
					{formatDuration(meeting.durationSeconds)}
				</p>
			</div>

			{audioUrl && (
				<div className="w-full max-w-full overflow-hidden pb-2">
					<audio
						controls
						src={audioUrl}
						className="h-10 w-full max-w-full"
						preload="metadata"
						aria-label="Reproduzir gravação da reunião"
					>
						<track kind="captions" />
					</audio>
				</div>
			)}
			<ol
				className={cn(
					"flex list-none flex-col gap-1 p-0",
					compact ? "gap-1" : "gap-1.5",
				)}
				aria-label="Status do processamento"
			>
				{STEP_CONFIG.map((step) => {
					const status = getStepStatus(step.key, step.status);
					return (
						<li
							key={step.key}
							className={cn(
								"flex flex-row items-center justify-between rounded-md px-3 py-2",
								compact ? "px-2.5 py-1.5" : "px-3 py-2",
								stepRowBg(status),
							)}
						>
							<span
								className={cn(
									compact && "text-xs",
									"text-sm",
									status === "done" &&
										"font-medium text-foreground",
									status === "failed" &&
										"font-medium text-destructive",
									(status === "pending" ||
										status === "in_progress") &&
										"text-muted-foreground",
									status === "cancelled" &&
										"text-muted-foreground/70",
								)}
							>
								{step.label}
							</span>
							<StepIndicator status={status} />
						</li>
					);
				})}
			</ol>
		</section>
	);
}
