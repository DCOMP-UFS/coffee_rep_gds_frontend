export type SortDirection = "asc" | "desc";

/** Opção do "Ordenar por". Sem `sort`, vale a ordem padrão do backend (mais recentes primeiro). */
export interface SortOption<TValue extends string = string> {
	value: TValue;
	label: string;
	sort?: { field: string; direction: SortDirection };
}

/** Parâmetro `sort` no formato do Spring (`campo,asc`); a ordem padrão não envia nada. */
export function toSortParam(option: SortOption | undefined): string | undefined {
	return option?.sort ? `${option.sort.field},${option.sort.direction}` : undefined;
}

/** Opção escolhida; um valor desconhecido cai na primeira, que é sempre a padrão. */
export function findSortOption<TOption extends SortOption>(
	options: readonly TOption[],
	value: string,
): TOption | undefined {
	return options.find((option) => option.value === value) ?? options[0];
}

/** Ordem alfabética em pt-BR, sem diferenciar acentos e maiúsculas e com números em ordem natural. */
export function compareText(a: string | null | undefined, b: string | null | undefined): number {
	return (a ?? "").localeCompare(b ?? "", "pt-BR", { sensitivity: "base", numeric: true });
}
