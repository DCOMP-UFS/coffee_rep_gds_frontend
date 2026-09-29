import { api } from "@/lib/api/client";
import type { Absence, AbsenceWriteDto } from "./types";

export const absencesApi = {
	/** Nunca paginado: o backend devolve um array puro. */
	async list(signal?: AbortSignal): Promise<Absence[]> {
		const response = await api.get<Absence[] | undefined>("requester-absence", undefined, signal);
		return Array.isArray(response) ? response : [];
	},
	create: (body: AbsenceWriteDto) => api.post("requester-absence", body),
	update: (id: number, body: AbsenceWriteDto) => api.put(`requester-absence/${id}`, body),
	remove: (id: number) => api.delete(`requester-absence/${id}`),
};
