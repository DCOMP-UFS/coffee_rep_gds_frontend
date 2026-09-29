import { useEffect, useState } from "react";

/** Espera depois da última tecla antes de aplicar a busca livre. */
export const SEARCH_DEBOUNCE_MS = 300;

interface DebounceOptions<T> {
	delay?: number;
	/** Valores que valem na hora, sem esperar; por exemplo, a busca apagada. */
	flush?: (value: T) => boolean;
}

/** `value` depois de `delay` ms sem mudanças. */
export function useDebouncedValue<T>(
	value: T,
	{ delay = SEARCH_DEBOUNCE_MS, flush }: DebounceOptions<T> = {},
): T {
	const [debounced, setDebounced] = useState(value);

	// Atualizado durante a renderização, para nenhuma consulta sair com o valor antigo.
	if (!Object.is(debounced, value) && flush?.(value)) {
		setDebounced(value);
	}

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debounced;
}

const isEmpty = (term: string) => term === "";

/**
 * Termo da busca livre, sem espaços nas pontas, aplicado depois da digitação. Apagar a busca
 * vale na hora, para a lista completa voltar sem espera.
 */
export function useDebouncedSearch(input: string) {
	const term = input.trim();
	const applied = useDebouncedValue(term, { flush: isEmpty });
	return { applied, isPending: term !== applied };
}
