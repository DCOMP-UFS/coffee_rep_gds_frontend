import type { FilterOption } from "@/components/filters/FilterSelect";
import { matchesSearch } from "@/shared/format/search";
import { compareText, type SortOption } from "@/shared/sorting/sort";
import type { Absence } from "./types";

export const ABSENCE_STATUS_OPTIONS = [
	{ value: "andamento", label: "Em andamento" },
	{ value: "proximas", label: "Próximas" },
	{ value: "encerradas", label: "Encerradas" },
] as const satisfies readonly FilterOption[];

export type AbsenceStatus = (typeof ABSENCE_STATUS_OPTIONS)[number]["value"];

/** A lista já chega ordenada pelo início mais recente (ver `sortAbsences`). */
export const ABSENCE_SORT_OPTIONS = [
	{ value: "inicio-desc", label: "Início mais recente" },
	{ value: "inicio-asc", label: "Início mais antigo" },
	{ value: "profissional-asc", label: "Profissional A–Z" },
	{ value: "profissional-desc", label: "Profissional Z–A" },
] as const satisfies readonly SortOption[];

export type AbsenceSort = (typeof ABSENCE_SORT_OPTIONS)[number]["value"];

export interface AbsenceFilters {
	search: string;
	/** `""` mostra todas. */
	status: AbsenceStatus | "";
	sort: AbsenceSort;
}

export const DEFAULT_ABSENCE_FILTERS: AbsenceFilters = {
	search: "",
	status: "",
	sort: "inicio-desc",
};

/** Filtros que reduzem a lista; a ordenação não conta. */
export const hasActiveAbsenceFilters = ({ search, status }: AbsenceFilters) =>
	search.trim() !== "" || status !== "";

/** Situação em relação a `today` (`AAAA-MM-DD`); sem as duas datas, não há como dizer. */
export function absenceStatus(absence: Absence, today: string): AbsenceStatus | null {
	const { dataInicio, dataFim } = absence;
	if (!dataInicio || !dataFim) return null;
	if (dataFim < today) return "encerradas";
	if (dataInicio > today) return "proximas";
	return "andamento";
}

/** Início mais antigo primeiro; sem data de início, no fim, como na ordem padrão. */
function compareStartAsc(a: Absence, b: Absence): number {
	const missing = Number(!a.dataInicio) - Number(!b.dataInicio);
	if (missing !== 0) return missing;
	return (
		(a.dataInicio ?? "").localeCompare(b.dataInicio ?? "") ||
		compareText(a.solicitanteNome, b.solicitanteNome)
	);
}

const COMPARATORS: Record<
	Exclude<AbsenceSort, "inicio-desc">,
	(a: Absence, b: Absence) => number
> = {
	"inicio-asc": compareStartAsc,
	"profissional-asc": (a, b) => compareText(a.solicitanteNome, b.solicitanteNome),
	"profissional-desc": (a, b) => compareText(b.solicitanteNome, a.solicitanteNome),
};

/**
 * Busca pelo profissional, filtra pela situação em relação a hoje (`today`, `AAAA-MM-DD`) e
 * ordena. Empates mantêm a ordem recebida, que é a do início mais recente.
 */
export function filterAbsences(
	absences: readonly Absence[],
	{ search, status, sort }: AbsenceFilters,
	today: string,
): Absence[] {
	const matching = absences.filter(
		(absence) =>
			matchesSearch(search, absence.solicitanteNome) &&
			(status === "" || absenceStatus(absence, today) === status),
	);
	return sort === "inicio-desc" ? matching : matching.sort(COMPARATORS[sort]);
}
