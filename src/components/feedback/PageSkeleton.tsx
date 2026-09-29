import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ROWS = 5;

/** Esboço de cabeçalho e tabela exibido enquanto o arquivo de uma tela é baixado. */
export function PageSkeleton() {
	return (
		<div aria-busy="true" className="flex flex-col gap-6 animate-in fade-in">
			<span className="sr-only" role="status">
				Carregando…
			</span>
			<div className="flex items-center gap-4" aria-hidden="true">
				<Skeleton className="size-12 rounded-xl" />
				<div className="grid gap-2">
					<Skeleton className="h-7 w-40" />
					<Skeleton className="h-4 w-64 max-w-full" />
				</div>
			</div>
			<div className="grid gap-3 rounded-xl border bg-card p-4" aria-hidden="true">
				{Array.from({ length: SKELETON_ROWS }, (_, row) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: linhas estáticas, sem identidade própria.
					<Skeleton key={row} className="h-9 w-full" />
				))}
			</div>
		</div>
	);
}
