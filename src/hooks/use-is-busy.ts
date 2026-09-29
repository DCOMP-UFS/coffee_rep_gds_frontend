import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useEffect, useState } from "react";

/** Há alguma consulta ou mutação em andamento, em qualquer lugar da aplicação. */
export function useIsBusy(): boolean {
	return useIsFetching() + useIsMutating() > 0;
}

/** Fica `true` só depois que `active` permanece verdadeiro por `delayMs` milissegundos. */
export function useDelayedFlag(active: boolean, delayMs: number): boolean {
	const [elapsed, setElapsed] = useState(false);

	useEffect(() => {
		if (!active) return;

		const timer = setTimeout(() => setElapsed(true), delayMs);
		return () => {
			clearTimeout(timer);
			setElapsed(false);
		};
	}, [active, delayMs]);

	return active && elapsed;
}
