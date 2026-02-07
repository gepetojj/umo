/** Dados de reunião exibidos no contexto (Postgres ou compatível). */
export interface MeetingForDisplay {
	id: string;
	title: string;
	durationSeconds: number;
	createdAt: number;
	/** ID da transcrição final quando disponível (null = ainda não transcrito). */
	transcriptionId?: string | null;
	/** true quando há gravação mas ainda não há transcrição. */
	transcriptionPending?: boolean;
}
