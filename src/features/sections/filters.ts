import { matchesSearch } from "@/shared/format/search";
import { compareText, type SortOption } from "@/shared/sorting/sort";
import type { Section } from "./types";

/** A lista já chega do backend da mais recente para a mais antiga. */
export const SECTION_SORT_OPTIONS = [
	{ value: "recentes", label: "Mais recentes" },
	{ value: "nome-asc", label: "Nome A–Z" },
	{ value: "nome-desc", label: "Nome Z–A" },
] as const satisfies readonly SortOption[];

export type SectionSort = (typeof SECTION_SORT_OPTIONS)[number]["value"];

export interface SectionFilters {
	search: string;
	sort: SectionSort;
}

export const DEFAULT_SECTION_FILTERS: SectionFilters = { search: "", sort: "recentes" };

/** Filtros que reduzem a lista; a ordenação não conta. */
export const hasActiveSectionFilters = ({ search }: SectionFilters) => search.trim() !== "";

/** Busca por nome ou observação, ignorando acentos e maiúsculas, e ordena. */
export function filterSections(sections: readonly Section[], { search, sort }: SectionFilters) {
	const matching = sections.filter((section) =>
		matchesSearch(search, section.nome, section.observacoes),
	);
	if (sort === "recentes") return matching;
	const direction = sort === "nome-asc" ? 1 : -1;
	return matching.sort((a, b) => direction * compareText(a.nome, b.nome));
}
