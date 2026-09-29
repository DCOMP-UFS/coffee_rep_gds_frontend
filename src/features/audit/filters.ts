import { findSortOption, type SortOption, toSortParam } from "@/shared/sorting/sort";
import { type AuditFilters, type AuditListParams, EMPTY_AUDIT_FILTERS } from "./types";

export const AUDIT_SORT_OPTIONS = [
	{ value: "recentes", label: "Mais recentes" },
	{ value: "antigos", label: "Mais antigos", sort: { field: "createdAt", direction: "asc" } },
] as const satisfies readonly SortOption[];

export type AuditSort = (typeof AUDIT_SORT_OPTIONS)[number]["value"];

/** Filtros aplicados na tela do histórico, com a ordenação. */
export interface HistoryFilters extends AuditFilters {
	sort: AuditSort;
}

export const DEFAULT_HISTORY_FILTERS: HistoryFilters = { ...EMPTY_AUDIT_FILTERS, sort: "recentes" };

/** Filtros que reduzem a lista; a ordenação não conta. */
export const hasActiveHistoryFilters = ({ sort: _sort, ...filters }: HistoryFilters) =>
	Object.values(filters).some((value) => value.trim() !== "");

/** Parâmetros da listagem, sem `sort` na ordem padrão; os filtros vazios o `auditApi` omite. */
export function toAuditListParams(
	{ sort, ...filters }: HistoryFilters,
	page: number,
	size: number,
): AuditListParams {
	const sortParam = toSortParam(findSortOption(AUDIT_SORT_OPTIONS, sort));
	return { ...filters, ...(sortParam && { sort: sortParam }), page, size };
}
