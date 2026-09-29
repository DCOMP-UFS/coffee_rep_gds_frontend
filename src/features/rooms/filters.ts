import { findSortOption, type SortOption, toSortParam } from "@/shared/sorting/sort";
import { ALL_SECTIONS, type RoomListFilters, type RoomStatusFilter } from "./types";

export const ROOM_SORT_OPTIONS = [
	{ value: "recentes", label: "Mais recentes" },
	{ value: "nome-asc", label: "Nome A–Z", sort: { field: "nome", direction: "asc" } },
	{ value: "nome-desc", label: "Nome Z–A", sort: { field: "nome", direction: "desc" } },
	{ value: "setor-asc", label: "Setor A–Z", sort: { field: "setor", direction: "asc" } },
] as const satisfies readonly SortOption[];

export type RoomSort = (typeof ROOM_SORT_OPTIONS)[number]["value"];

export interface RoomFilters {
	search: string;
	/** Vem da URL (`?setor=`); `ALL_SECTIONS` significa "Todas". */
	sectionId: number;
	status: RoomStatusFilter;
	sort: RoomSort;
}

export const DEFAULT_ROOM_FILTERS: RoomFilters = {
	search: "",
	sectionId: ALL_SECTIONS,
	status: "Todas",
	sort: "recentes",
};

/** Filtros que reduzem a lista; a ordenação não conta. */
export const hasActiveRoomFilters = ({ search, sectionId, status }: RoomFilters) =>
	search.trim() !== "" ||
	sectionId !== DEFAULT_ROOM_FILTERS.sectionId ||
	status !== DEFAULT_ROOM_FILTERS.status;

/** Parâmetros da listagem, sem espaços na busca e sem `sort` na ordem padrão. */
export function toRoomListFilters(
	{ search, sectionId, status, sort }: RoomFilters,
	page: number,
	size: number,
): RoomListFilters {
	const sortParam = toSortParam(findSortOption(ROOM_SORT_OPTIONS, sort));
	return {
		sectionId,
		status,
		search: search.trim(),
		...(sortParam && { sort: sortParam }),
		page,
		size,
	};
}
