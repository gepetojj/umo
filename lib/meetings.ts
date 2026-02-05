/** Dados de reunião exibidos no contexto (Postgres ou compatível). */
export interface MeetingForDisplay {
	id: string;
	title: string;
	durationSeconds: number;
	createdAt: number;
}
