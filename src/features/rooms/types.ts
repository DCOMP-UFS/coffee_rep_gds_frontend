export interface Room {
	id: number;
	nome: string;
	ocupada: boolean;
	/** Nome do setor. */
	setor: string;
	setorId: number;
}

export const ROOM_STATUS_FILTERS = ["Todas", "Ocupada", "Livre"] as const;
export type RoomStatusFilter = (typeof ROOM_STATUS_FILTERS)[number];

/** Setor `0` significa "Todas", como no filtro do Angular. */
export const ALL_SECTIONS = 0;

export interface RoomListFilters {
	sectionId: number;
	status: RoomStatusFilter;
	/** Parte do nome da sala; vazio lista todas. */
	search: string;
	/** `campo,direção`; ausente mantém a ordem padrão, das mais recentes. */
	sort?: string;
	/** Base 0. */
	page: number;
	size: number;
}

export interface RoomWriteDto {
	nome: string;
	setorId: number;
}
