import { useIsBusy } from "@/hooks/use-is-busy";

/** Barra indeterminada no topo da página enquanto houver requisição em andamento. */
export function GlobalProgress() {
	const busy = useIsBusy();
	if (!busy) return null;

	return (
		<div
			role="progressbar"
			aria-label="Carregando"
			className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-ring/15"
		>
			<div className="h-full w-2/5 animate-progress rounded-full bg-ring" />
		</div>
	);
}
