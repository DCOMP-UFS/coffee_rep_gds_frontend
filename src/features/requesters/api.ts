import { api } from "@/lib/api/client";
import type { PagedResponse } from "@/shared/types/pagination";
import type { Requester, RequesterListFilters, RequesterWriteDto } from "./types";

export const requestersApi = {
	/** Busca por nome, especialidade ou telefone; `busca` só vai quando há termo. */
	list: ({ search, page, size }: RequesterListFilters, signal?: AbortSignal) =>
		api.get<PagedResponse<Requester>>(
			"requester",
			{ size, page, busca: search.trim() || undefined },
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
