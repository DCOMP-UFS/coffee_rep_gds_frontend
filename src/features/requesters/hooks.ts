import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { absenceKeys } from "@/features/absences/query-keys";
import { requestersApi } from "./api";
import { requesterKeys } from "./query-keys";
import type { RequesterListFilters, RequesterWriteDto } from "./types";

export function useRequesters(filters: RequesterListFilters) {
	return useQuery({
		queryKey: requesterKeys.list(filters),
		queryFn: ({ signal }) => requestersApi.list(filters, signal),
		// Mantém a página anterior na tela enquanto a próxima carrega, sem piscar o esqueleto.
		placeholderData: keepPreviousData,
	});
}

export function useAllRequesters() {
	return useQuery({
		queryKey: requesterKeys.active(),
		queryFn: ({ signal }) => requestersApi.listAll(signal),
	});
}

/** Ausências exibem o nome do solicitante, então mudanças aqui também as invalidam. */
function useInvalidateRequestersAndAbsences() {
	const queryClient = useQueryClient();
	return () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: requesterKeys.all }),
			queryClient.invalidateQueries({ queryKey: absenceKeys.all }),
		]);
}

/** Fallbacks das mutations abaixo, cujos erros aparecem no próprio diálogo. */
export const REQUESTER_ERROR_MESSAGES = {
	save: "Não foi possível salvar o solicitante. Tente novamente.",
	remove: "Não foi possível excluir o solicitante. Tente novamente.",
} as const;

export function useSaveRequester() {
	const invalidate = useInvalidateRequestersAndAbsences();
	return useMutation({
		mutationFn: ({ id, body }: { id?: number; body: RequesterWriteDto }) =>
			id === undefined ? requestersApi.create(body) : requestersApi.update(id, body),
		onSuccess: invalidate,
		meta: { inlineError: true },
	});
}

export function useDeleteRequester() {
	const invalidate = useInvalidateRequestersAndAbsences();
	return useMutation({
		mutationFn: requestersApi.remove,
		onSuccess: invalidate,
		meta: { inlineError: true },
	});
}
