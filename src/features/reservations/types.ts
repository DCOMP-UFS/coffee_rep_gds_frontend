/**
 * Reserva como o backend devolve na listagem. Horários vêm como `AAAA-MM-DDTHH:mm:ss`, no
 * horário local e sem fuso; campos nulos são omitidos.
 */
export interface Reservation {
	reservationId: number;
	horaInicio: string;
	horaFim: string;
	sala: string;
	setor: string;
	solicitante: string;
	criador?: string | null;
	salaId: number;
	setorId?: number | null;
	solicitanteId: number;
	/** Presente só nas ocorrências de uma reserva recorrente. */
	recorrenciaId?: number | null;
	profissionalAusente?: boolean;
}

/** Corpo do `POST reservation`. Em reserva recorrente, as datas delimitam o período. */
export interface ReservationWriteDto {
	salaId: number;
	solicitanteId: number;
	horaInicio: string;
	horaFim: string;
	fixo: boolean;
	observacoes: string;
	/** Dias da semana ISO (1 = segunda); só vai em reserva recorrente. */
	dias?: number[];
}

/** Período em datas ISO (`AAAA-MM-DD`), inclusive nas duas pontas, e filtros opcionais. */
export interface ReservationListFilters {
	inicio: string;
	fim: string;
	/** Sala, setor, solicitante ou quem criou; vazio não filtra. */
	search: string;
	setorId?: number;
	/** `true` só recorrentes, `false` só pontuais; ausente, as duas. */
	recorrente?: boolean;
	/** `campo,asc|desc`; ausente, do mais recente para o mais antigo. */
	sort?: string;
	page: number;
	size: number;
}

/** Período do calendário em datas ISO, inclusive nas duas pontas, e setor opcional. */
export interface CalendarReservationFilters {
	inicio: string;
	fim: string;
	setorId?: number;
}

/** Cancelar só a ocorrência escolhida ou a série inteira. */
export type CancelScope = "one" | "series";
