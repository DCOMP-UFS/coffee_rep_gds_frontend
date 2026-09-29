import { useCallback, useState } from "react";

/**
 * Página atual de uma lista filtrada. Volta para a primeira assim que os filtros aplicados
 * mudam, na mesma renderização, para nenhuma consulta sair com a página antiga.
 */
export function useFilteredPage(filters: unknown) {
	const key = JSON.stringify(filters);
	const [state, setState] = useState({ key, page: 0 });
	const page = state.key === key ? state.page : 0;
	const setPage = useCallback((next: number) => setState({ key, page: next }), [key]);
	return [page, setPage] as const;
}
