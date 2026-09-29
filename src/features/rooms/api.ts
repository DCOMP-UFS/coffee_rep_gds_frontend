import { api } from "@/lib/api/client";
import type { PagedResponse } from "@/shared/types/pagination";
import {
	ALL_SECTIONS,
	type Room,
	type RoomListFilters,
	type RoomStatusFilter,
	type RoomWriteDto,
} from "./types";

/** "Todas" omite o parâmetro `ocupada`; o backend então traz salas ocupadas e livres. */
export function statusToOcupada(status: RoomStatusFilter): boolean | undefined {
	if (status === "Todas") return undefined;
	return status === "Ocupada";
}

export const roomsApi = {
	/**
	 * Mesma URL do `RoomService` do Angular: com setor, `room/section/{id}`; sem, `room`. Busca e
	 * ordenação só são enviadas quando preenchidas.
	 */
	list: ({ sectionId, status, search, sort, page, size }: RoomListFilters, signal?: AbortSignal) =>
		api.get<PagedResponse<Room>>(
			sectionId === ALL_SECTIONS ? "room" : `room/section/${sectionId}`,
			{ size, page, ocupada: statusToOcupada(status), nome: search.trim() || undefined, sort },
			signal,
		),

	/** Total de salas, opcionalmente só ocupadas ou só livres, lido dos metadados de página. */
	async count(ocupada: boolean | null, signal?: AbortSignal): Promise<number> {
		const response = await api.get<PagedResponse<Room>>(
			"room",
			{ page: 0, size: 1, ocupada },
			signal,
		);
		return response.page.totalElements;
	},

	/** Quantidade de salas ativas de um setor. */
	async countBySection(sectionId: number, signal?: AbortSignal): Promise<number> {
		const response = await api.get<PagedResponse<Room>>(
			`room/section/${sectionId}`,
			{ page: 0, size: 1 },
			signal,
		);
		return response.page.totalElements;
	},

	/** Todas as salas ativas de um setor. Com `unpaged=true` o backend devolve um array puro. */
	async listBySection(sectionId: number, signal?: AbortSignal): Promise<Room[]> {
		const response = await api.get<Room[] | { content?: Room[] }>(
			`room/section/${sectionId}`,
			{ unpaged: true },
			signal,
		);
		return Array.isArray(response) ? response : (response.content ?? []);
	},

	create: (body: RoomWriteDto) => api.post("room", body),
	update: (id: number, body: RoomWriteDto) => api.put(`room/${id}`, body),
	remove: (id: number) => api.delete(`room/${id}`),
};
