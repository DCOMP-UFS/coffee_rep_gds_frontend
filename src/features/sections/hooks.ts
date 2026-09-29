import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roomKeys } from "@/features/rooms/query-keys";
import { sectionsApi } from "./api";
import type { SectionWriteDto } from "./types";

export const sectionKeys = {
	all: ["sections"] as const,
};

export function useSections() {
	return useQuery({
		queryKey: sectionKeys.all,
		queryFn: ({ signal }) => sectionsApi.listAll(signal),
	});
}

/** Salas exibem o nome do setor, então mudanças em setores também invalidam as salas. */
function useInvalidateSectionsAndRooms() {
	const queryClient = useQueryClient();
	return () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: sectionKeys.all }),
			queryClient.invalidateQueries({ queryKey: roomKeys.all }),
		]);
}

/** Fallbacks das mutations abaixo, cujos erros aparecem no próprio diálogo. */
export const SECTION_ERROR_MESSAGES = {
	save: "Não foi possível salvar o setor.",
	remove: "Não foi possível remover o setor.",
} as const;

export function useSaveSection() {
	const invalidate = useInvalidateSectionsAndRooms();

	return useMutation({
		mutationFn: ({ id, body }: { id?: number; body: SectionWriteDto }) =>
			id === undefined ? sectionsApi.create(body) : sectionsApi.update(id, body),
		onSuccess: invalidate,
		meta: { inlineError: true },
	});
}

export function useDeleteSection() {
	const invalidate = useInvalidateSectionsAndRooms();

	return useMutation({
		mutationFn: sectionsApi.remove,
		onSuccess: invalidate,
		meta: { inlineError: true },
	});
}
