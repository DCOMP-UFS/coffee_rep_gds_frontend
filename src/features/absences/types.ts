export interface Absence {
	id: number;
	solicitanteId: number;
	solicitanteNome: string;
	/** `AAAA-MM-DD`. */
	dataInicio?: string | null;
	/** `AAAA-MM-DD`. */
	dataFim?: string | null;
}

export interface AbsenceWriteDto {
	solicitanteId: number;
	/** `AAAA-MM-DD`. */
	dataInicio: string;
	/** `AAAA-MM-DD`. */
	dataFim: string;
}
