import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roomKeys } from "@/features/rooms/query-keys";
import { reservationsApi } from "./api";
import { reservationKeys } from "./query-keys";
import type { CalendarReservationFilters, CancelScope, ReservationListFilters } from "./types";

export function useReservations(filters: ReservationListFilters) {
	return useQuery({
		queryKey: reservationKeys.list(filters),
		queryFn: ({ signal }) => reservationsApi.list(filters, signal),
		// Mantém a página anterior na tela enquanto a próxima carrega, sem piscar o esqueleto.
		placeholderData: keepPreviousData,
	});
}

/** Reservas de todo o período visível no calendário; o erro aparece na própria tela. */
export function useCalendarReservations(filters: CalendarReservationFilters) {
	return useQuery({
		queryKey: reservationKeys.calendar(filters),
		queryFn: ({ signal }) => reservationsApi.listAllInRange(filters, signal),
		// Mantém o mês anterior na tela enquanto o próximo carrega.
		placeholderData: keepPreviousData,
		meta: { inlineError: true },
	});
}

/** A ocupação das salas é calculada a partir das reservas, então as salas também são invalidadas. */
function useInvalidateReservationsAndRooms() {
	const queryClient = useQueryClient();
	return () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: reservationKeys.all }),
			queryClient.invalidateQueries({ queryKey: roomKeys.all }),
		]);
}

/** Fallbacks das mutations abaixo, cujos erros aparecem no próprio diálogo. */
export const RESERVATION_ERROR_MESSAGES = {
	create: "Não foi possível criar a reserva. Tente novamente.",
	cancel: "Não foi possível cancelar a reserva. Tente novamente.",
} as const;

export function useCreateReservation() {
	const invalidate = useInvalidateReservationsAndRooms();
	return useMutation({
		mutationFn: reservationsApi.create,
		onSuccess: invalidate,
		meta: { inlineError: true },
	});
}

interface CancelReservationInput {
	reservationId: number;
	recorrenciaId?: number | null;
	scope: CancelScope;
}

export function useCancelReservation() {
	const invalidate = useInvalidateReservationsAndRooms();
	return useMutation({
		mutationFn: ({ reservationId, recorrenciaId, scope }: CancelReservationInput) =>
			scope === "series" && recorrenciaId
				? reservationsApi.cancelSeries(recorrenciaId)
				: reservationsApi.cancelOne(reservationId),
		onSuccess: invalidate,
		meta: { inlineError: true },
	});
}
