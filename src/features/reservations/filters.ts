import type { FilterOption } from "@/components/filters/FilterSelect";
import { ALL_SECTIONS } from "@/features/rooms/types";
import { findSortOption, type SortOption, toSortParam } from "@/shared/sorting/sort";
import { brDateToIsoDate } from "@/shared/validators/date";
import { defaultReservationPeriod } from "./schemas";
import type { ReservationListFilters } from "./types";

export const RESERVATION_SORT_OPTIONS = [
	{ value: "recentes", label: "Mais recentes" },
	{
		value: "inicio-asc",
		label: "Início mais próximo",
		sort: { field: "horaInicio", direction: "asc" },
	},
	{
		value: "inicio-desc",
		label: "Início mais distante",
		sort: { field: "horaInicio", direction: "desc" },
	},
	{ value: "sala-asc", label: "Sala A–Z", sort: { field: "sala", direction: "asc" } },
	{
		value: "solicitante-asc",
		label: "Solicitante A–Z",
		sort: { field: "solicitante", direction: "asc" },
	},
] as const satisfies readonly SortOption[];

export type ReservationSort = (typeof RESERVATION_SORT_OPTIONS)[number]["value"];

/** `""` mostra os dois tipos. */
export type ReservationTypeFilter = "" | "pontual" | "recorrente";

export const RESERVATION_TYPE_OPTIONS = [
	{ value: "pontual", label: "Pontual" },
	{ value: "recorrente", label: "Recorrente" },
] as const satisfies readonly FilterOption<ReservationTypeFilter>[];

export interface ReservationFilters {
	search: string;
	/** Período em datas ISO (`AAAA-MM-DD`), inclusive nas duas pontas. */
	inicio: string;
	fim: string;
	/** `ALL_SECTIONS` significa "Todos". */
	sectionId: number;
	type: ReservationTypeFilter;
	sort: ReservationSort;
}

/** Sem filtros, com o período padrão de hoje até daqui a 30 dias, no horário local. */
export function defaultReservationFilters(now: Date = new Date()): ReservationFilters {
	const period = defaultReservationPeriod(now);
	return {
		search: "",
		inicio: brDateToIsoDate(period.inicio),
		fim: brDateToIsoDate(period.fim),
		sectionId: ALL_SECTIONS,
		type: "",
		sort: "recentes",
	};
}

/** Filtros que reduzem a lista em relação aos padrões, inclusive um período diferente; a ordenação não conta. */
export const hasActiveReservationFilters = (
	{ search, inicio, fim, sectionId, type }: ReservationFilters,
	defaults: ReservationFilters,
) =>
	search.trim() !== "" ||
	inicio !== defaults.inicio ||
	fim !== defaults.fim ||
	sectionId !== defaults.sectionId ||
	type !== defaults.type;

/** Parâmetros da listagem, sem espaços na busca, sem filtros desligados e sem `sort` na ordem padrão. */
export function toReservationListFilters(
	{ search, inicio, fim, sectionId, type, sort }: ReservationFilters,
	page: number,
	size: number,
): ReservationListFilters {
	const sortParam = toSortParam(findSortOption(RESERVATION_SORT_OPTIONS, sort));
	return {
		inicio,
		fim,
		search: search.trim(),
		...(sectionId !== ALL_SECTIONS && { setorId: sectionId }),
		...(type !== "" && { recorrente: type === "recorrente" }),
		...(sortParam && { sort: sortParam }),
		page,
		size,
	};
}
