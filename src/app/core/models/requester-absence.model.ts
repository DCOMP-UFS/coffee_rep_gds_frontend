export interface RequesterAbsence {
	id: number;
	solicitanteId: number;
	solicitanteNome: string;
	/** ISO date yyyy-mm-dd */
	dataInicio: string;
	dataFim: string;
}

export interface CreateRequesterAbsencePayload {
	solicitanteId: number;
	dataInicio: string;
	dataFim: string;
}
