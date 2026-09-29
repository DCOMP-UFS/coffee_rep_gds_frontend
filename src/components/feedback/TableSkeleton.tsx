import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

/** Linhas fantasmas no corpo da tabela, mantendo o cabeçalho visível durante a carga. */
export function TableSkeleton({ rows, columns }: { rows: number; columns: number }) {
	return Array.from({ length: rows }, (_, row) => (
		// biome-ignore lint/suspicious/noArrayIndexKey: linhas estáticas, sem identidade própria.
		<TableRow key={row} aria-hidden="true">
			{Array.from({ length: columns }, (_, column) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: colunas estáticas, sem identidade própria.
				<TableCell key={column}>
					<Skeleton className="h-5 w-full max-w-48" />
				</TableCell>
			))}
		</TableRow>
	));
}
