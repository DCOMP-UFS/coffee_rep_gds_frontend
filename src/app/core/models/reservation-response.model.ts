import { PaginationModel } from "./pagination-response.model";

export interface ReservationResponseModel {
	content: Reservation[];
	page: PaginationModel;
}

export interface Reservation {
	horaInicio: Date;
	horaFim: Date;
	sala: string;
	setor: string;
	solicitante: string;
	criador: string;
	salaId: number;
	solicitanteId: number;
	reservationId: number;
	recorrenciaId?: number;
	/** True quando o profissional está em ausência/férias no dia da ocorrência (sala livre na UI). */
	profissionalAusente?: boolean;
}
