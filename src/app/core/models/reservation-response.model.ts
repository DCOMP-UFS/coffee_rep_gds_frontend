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
	salaId: number;
	solicitanteId: number;
}
