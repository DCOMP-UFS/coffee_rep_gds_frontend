import type { SelectOption } from "@/components/form/SearchableSelect";
import { compareText, findSortOption, type SortOption, toSortParam } from "@/shared/sorting/sort";
import type { Requester, RequesterListFilters } from "./types";

export const REQUESTER_SORT_OPTIONS = [
	{ value: "recentes", label: "Mais recentes" },
	{ value: "nome-asc", label: "Nome A–Z", sort: { field: "nome", direction: "asc" } },
	{ value: "nome-desc", label: "Nome Z–A", sort: { field: "nome", direction: "desc" } },
	{
		value: "especialidade-asc",
		label: "Especialidade A–Z",
		sort: { field: "especialidade", direction: "asc" },
	},
] as const satisfies readonly SortOption[];

export type RequesterSort = (typeof REQUESTER_SORT_OPTIONS)[number]["value"];

export interface RequesterFilters {
	search: string;
	/** `""` mostra todas. */
	specialty: string;
	sort: RequesterSort;
}

export const DEFAULT_REQUESTER_FILTERS: RequesterFilters = {
	search: "",
	specialty: "",
	sort: "recentes",
};

/** Filtros que reduzem a lista; a ordenação não conta. */
export const hasActiveRequesterFilters = ({ search, specialty }: RequesterFilters) =>
	search.trim() !== "" || specialty !== "";

/** Parâmetros da listagem, sem espaços na busca e sem `sort` na ordem padrão. */
export function toRequesterListFilters(
	{ search, specialty, sort }: RequesterFilters,
	page: number,
	size: number,
): RequesterListFilters {
	const sortParam = toSortParam(findSortOption(REQUESTER_SORT_OPTIONS, sort));
	return { search: search.trim(), specialty, ...(sortParam && { sort: sortParam }), page, size };
}

/** Valor da opção "Todas" no select; no filtro, "Todas" é `""`. */
export const ALL_SPECIALTIES_OPTION = "__todas__";

/**
 * Especialidades dos solicitantes ativos, sem repetição e em ordem alfabética, precedidas de
 * "Todas". Grafias que só diferem nas maiúsculas viram uma opção, porque o backend as compara
 * assim; acentos diferentes continuam separados, porque para ele são especialidades diferentes.
 */
export function specialtyOptions(requesters: readonly Requester[]): SelectOption<string>[] {
	const unique = new Map<string, string>();
	for (const requester of requesters) {
		const specialty = requester.especialidade?.trim();
		if (!specialty) continue;
		const key = specialty.toLocaleLowerCase("pt-BR");
		if (!unique.has(key)) unique.set(key, specialty);
	}
	return [
		{ value: ALL_SPECIALTIES_OPTION, label: "Todas" },
		...[...unique.values()].sort(compareText).map((specialty) => ({
			value: specialty,
			label: specialty,
		})),
	];
}
