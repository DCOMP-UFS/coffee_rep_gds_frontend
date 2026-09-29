import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type RowData,
	useReactTable,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import { ErrorState } from "@/components/feedback/ErrorState";
import { TableSkeleton } from "@/components/feedback/TableSkeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

declare module "@tanstack/react-table" {
	interface ColumnMeta<TData extends RowData, TValue> {
		/** Classes aplicadas ao cabeçalho e às células da coluna. */
		className?: string;
	}
}

interface DataTableProps<TData> {
	columns: ColumnDef<TData>[];
	data: TData[];
	getRowId: (row: TData) => string;
	isLoading: boolean;
	isError: boolean;
	onRetry: () => void;
	isRetrying?: boolean;
	/** Exibido quando a consulta terminou sem registros. */
	emptyState: ReactNode;
	/** Indica que os dados na tela são da consulta anterior e uma nova está a caminho. */
	isPlaceholderData?: boolean;
	skeletonRows?: number;
	footer?: ReactNode;
	caption: string;
}

/**
 * Tabela de apresentação: ordenação e paginação ficam com o backend, então aqui só se
 * renderizam as linhas recebidas, com os estados de carga, erro e vazio.
 */
export function DataTable<TData>({
	columns,
	data,
	getRowId,
	isLoading,
	isError,
	onRetry,
	isRetrying,
	emptyState,
	isPlaceholderData = false,
	skeletonRows = 5,
	footer,
	caption,
}: DataTableProps<TData>) {
	const table = useReactTable({
		data,
		columns,
		getRowId,
		getCoreRowModel: getCoreRowModel(),
	});

	if (isError && data.length === 0) {
		return <ErrorState onRetry={onRetry} isRetrying={isRetrying} />;
	}

	if (!isLoading && data.length === 0) {
		return emptyState;
	}

	return (
		<>
			<Table
				aria-busy={isLoading || isPlaceholderData}
				className={cn("transition-opacity", isPlaceholderData && "opacity-60")}
			>
				<caption className="sr-only">{caption}</caption>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id} className="bg-muted/60 hover:bg-muted/60">
							{headerGroup.headers.map((header) => (
								<TableHead
									key={header.id}
									className={cn(
										"h-11 px-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase",
										header.column.columnDef.meta?.className,
									)}
								>
									{header.isPlaceholder
										? null
										: flexRender(header.column.columnDef.header, header.getContext())}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{isLoading ? (
						<TableSkeleton rows={skeletonRows} columns={columns.length} />
					) : (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell
										key={cell.id}
										className={cn(
											"px-4 py-3 whitespace-normal wrap-break-word",
											cell.column.columnDef.meta?.className,
										)}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
			{footer}
		</>
	);
}
