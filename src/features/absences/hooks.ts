import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roomKeys } from "@/features/rooms/query-keys";
import { absencesApi } from "./api";
import { absenceKeys } from "./query-keys";
import { sortAbsences } from "./sort";
import type { AbsenceWriteDto } from "./types";

/** `inlineError`: a tela mostra a falha ao carregar, e o aviso no canto fica só para o 401. */
export function useAbsences({ inlineError = false }: { inlineError?: boolean } = {}) {
	return useQuery({
		queryKey: absenceKeys.all,
		queryFn: ({ signal }) => absencesApi.list(signal),
		select: sortAbsences,
		meta: inlineError ? { inlineError: true } : undefined,
	});
}

/**
 * No backend, uma sala ocupada conta como livre quando o profissional da reserva está
 * ausente hoje, então mudanças em ausências também invalidam as salas.
 */
function useInvalidateAbsencesAndRooms() {
	const queryClient = useQueryClient();
	return () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: absenceKeys.all }),
			queryClient.invalidateQueries({ queryKey: roomKeys.all }),
		]);
}

/** Fallbacks das mutations abaixo, cujos erros aparecem no próprio diálogo. */
export const ABSENCE_ERROR_MESSAGES = {
	save: "Não foi possível salvar a ausência. Tente novamente.",
	remove: "Não foi possível remover a ausência. Tente novamente.",
} as const;

export function useSaveAbsence() {
	const invalidate = useInvalidateAbsencesAndRooms();
	return useMutation({
		mutationFn: ({ id, body }: { id?: number; body: AbsenceWriteDto }) =>
			id === undefined ? absencesApi.create(body) : absencesApi.update(id, body),
		onSuccess: invalidate,
		meta: { inlineError: true },
	});
}

export function useDeleteAbsence() {
	const invalidate = useInvalidateAbsencesAndRooms();
	return useMutation({
		mutationFn: absencesApi.remove,
		onSuccess: invalidate,
		meta: { inlineError: true },
	});
}
