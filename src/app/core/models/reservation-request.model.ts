export interface ReservationRequestModel {
	salaId: number;
	solicitanteId: number;
	horaInicio: string;
	horaFim: string;
	observacoes: string;
	dias?: number[];
}
