import { api } from "@/lib/api/client";
import type { PagedResponse } from "@/shared/types/pagination";
import type { Requester, RequesterListFilters, RequesterWriteDto } from "./types";

export const requestersApi = {
	/** Busca por nome, especialidade ou telefone; cada filtro só vai quando preenchido. */
	list: ({ search, specialty, sort, page, size }: RequesterListFilters, signal?: AbortSignal) =>
		api.get<PagedResponse<Requester>>(
			"requester",
			{
				size,
				page,
				busca: search.trim() || undefined,
				especialidade: specialty.trim() || undefined,
				sort,
			},
			signal,
		),

	/** Todos os solicitantes ativos. Com `unpaged=true` o backend devolve um array puro. */
	async listAll(signal?: AbortSignal): Promise<Requester[]> {
		const response = await api.get<Requester[] | { content?: Requester[] }>(
			"requester",
			{ unpaged: true },
			signal,
		);
		return Array.isArray(response) ? response : (response.content ?? []);
	},

	create: (body: RequesterWriteDto) => api.post("requester", body),
	update: (id: number, body: RequesterWriteDto) => api.put(`requester/${id}`, body),
	remove: (id: number) => api.delete(`requester/${id}`),
};
