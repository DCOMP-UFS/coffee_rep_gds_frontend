import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roomsApi } from "./api";
import { roomKeys } from "./query-keys";
import type { RoomListFilters, RoomWriteDto } from "./types";

export function useRooms(filters: RoomListFilters) {
	return useQuery({
		queryKey: roomKeys.list(filters),
		queryFn: ({ signal }) => roomsApi.list(filters, signal),
		// Mantém a página anterior na tela enquanto a próxima carrega, sem piscar o esqueleto.
		placeholderData: keepPreviousData,
	});
}

/** Contagem para a faixa de resumo. Falhas não geram toast: a listagem já avisa o usuário. */
export function useRoomCount(ocupada: boolean | null) {
	return useQuery({
		queryKey: roomKeys.count(ocupada),
		queryFn: ({ signal }) => roomsApi.count(ocupada, signal),
		meta: { silentError: true },
	});
}

/**
 * Salas de um setor, conferidas antes de excluí-lo. Sempre consulta de novo ao ser
 * habilitada: a exclusão não pode se basear num resultado guardado em cache.
 */
export function useSectionRoomCount(
	sectionId: number | undefined,
	{ enabled }: { enabled: boolean },
) {
	return useQuery({
		queryKey: roomKeys.sectionCount(sectionId ?? 0),
		queryFn: ({ signal }) => roomsApi.countBySection(sectionId ?? 0, signal),
		enabled: enabled && sectionId !== undefined,
		staleTime: 0,
		meta: { inlineError: true },
	});
}

/** Salas de um setor para os selects de formulário; fica desligada até haver um setor. */
export function useSectionRooms(sectionId: number | null) {
	return useQuery({
		queryKey: roomKeys.bySection(sectionId ?? 0),
		queryFn: ({ signal }) => roomsApi.listBySection(sectionId ?? 0, signal),
		enabled: sectionId !== null,
		meta: { inlineError: true },
	});
}

function useInvalidateRooms() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: roomKeys.all });
}

/** Fallbacks das mutations abaixo, cujos erros aparecem no próprio diálogo. */
export const ROOM_ERROR_MESSAGES = {
	create: "Não foi possível criar a sala. Tente novamente.",
	update: "Não foi possível salvar a sala. Tente novamente.",
	remove: "Não foi possível excluir a sala. Tente novamente.",
} as const;

export function useCreateRoom() {
	const invalidate = useInvalidateRooms();
	return useMutation({
		mutationFn: roomsApi.create,
		onSuccess: invalidate,
		meta: { inlineError: true },
	});
}

export function useUpdateRoom() {
	const invalidate = useInvalidateRooms();
	return useMutation({
		mutationFn: ({ id, body }: { id: number; body: RoomWriteDto }) => roomsApi.update(id, body),
		onSuccess: invalidate,
		meta: { inlineError: true },
	});
}

export function useDeleteRoom() {
	const invalidate = useInvalidateRooms();
	return useMutation({
		mutationFn: roomsApi.remove,
		onSuccess: invalidate,
		meta: { inlineError: true },
	});
}
