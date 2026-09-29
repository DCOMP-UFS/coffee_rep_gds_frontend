import { api } from "@/lib/api/client";
import type { PagedResponse } from "@/shared/types/pagination";
import type {
	CalendarReservationFilters,
	Reservation,
	ReservationListFilters,
	ReservationWriteDto,
} from "./types";

/** Tamanho de cada página ao buscar um período inteiro; o backend não impõe limite. */
export const RANGE_PAGE_SIZE = 500;

const periodQuery = (inicio: string, fim: string) => ({
	inicio: `${inicio}T00:00:00`,
	fim: `${fim}T23:59:59`,
});

export const reservationsApi = {
	/** Reservas que tocam o período, do início do primeiro dia ao fim do último. */
	list: (
		{ inicio, fim, search, setorId, recorrente, sort, page, size }: ReservationListFilters,
		signal?: AbortSignal,
	) =>
		api.get<PagedResponse<Reservation>>(
			"reservation",
			{
				size,
				page,
				...periodQuery(inicio, fim),
				busca: search.trim() || undefined,
				setorId,
				recorrente,
				sort,
			},
			signal,
		),

	/**
	 * Todas as reservas do período. A primeira página informa quantas existem e as demais são
	 * buscadas em paralelo, para nenhuma reserva ficar de fora por causa de um limite fixo.
	 */
	async listAllInRange(
		{ inicio, fim, setorId }: CalendarReservationFilters,
		signal?: AbortSignal,
	): Promise<Reservation[]> {
		const fetchPage = (page: number) =>
			api.get<PagedResponse<Reservation>>(
				"reservation",
				{ size: RANGE_PAGE_SIZE, page, setorId, ...periodQuery(inicio, fim) },
				signal,
			);

		const first = await fetchPage(0);
		const remaining = Array.from({ length: Math.max(first.page.totalPages - 1, 0) }, (_, index) =>
			fetchPage(index + 1),
		);
		const rest = await Promise.all(remaining);
		return [first, ...rest].flatMap((response) => response.content);
	},

	create: (body: ReservationWriteDto) => api.post("reservation", body),
	/** Cancela uma ocorrência; o backend ignora o corpo. */
	cancelOne: (reservationId: number) => api.patch(`reservation/${reservationId}`),
	/** Cancela todas as ocorrências da série, inclusive as que já passaram. */
	cancelSeries: (recorrenciaId: number) => api.delete(`reservation/recurrent/${recorrenciaId}`),
};
