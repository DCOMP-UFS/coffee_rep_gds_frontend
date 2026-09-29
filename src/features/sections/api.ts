import { api } from "@/lib/api/client";
import type { Section, SectionWriteDto } from "./types";

export const sectionsApi = {
	/**
	 * Todos os setores ativos. Com `unpaged=true` o backend devolve um array puro; o envelope
	 * `{ content }` também é aceito, como no `SectionService` do Angular.
	 */
	async listAll(signal?: AbortSignal): Promise<Section[]> {
		const response = await api.get<Section[] | { content?: Section[] }>(
			"section",
			{ unpaged: true },
			signal,
		);
		return Array.isArray(response) ? response : (response.content ?? []);
	},
	create: (body: SectionWriteDto) => api.post("section", body),
	update: (id: number, body: SectionWriteDto) => api.put(`section/${id}`, body),
	remove: (id: number) => api.delete(`section/${id}`),
};
