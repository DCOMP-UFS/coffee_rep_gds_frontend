import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useId } from "react";
import { SelectPlaceholderItem } from "@/components/form/SelectPlaceholderItem";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PageMetadata } from "@/shared/types/pagination";
import { paginationRange } from "./pagination-range";

interface PaginationBarProps {
	/** Metadados da página atual, como vêm do backend (página base 0). */
	page: PageMetadata;
	pageSizeOptions: readonly number[];
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	disabled?: boolean;
}

export function PaginationBar({
	page,
	pageSizeOptions,
	onPageChange,
	onPageSizeChange,
	disabled = false,
}: PaginationBarProps) {
	const sizeLabelId = useId();
	const { number: current, size, totalElements, totalPages } = page;
	const isFirst = current <= 0;
	const isLast = current >= totalPages - 1;

	const from = totalElements === 0 ? 0 : current * size + 1;
	const to = Math.min((current + 1) * size, totalElements);

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
			<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
				<p aria-live="polite" className="whitespace-nowrap">
					Mostrando <span className="font-medium text-foreground">{from}</span>–
					<span className="font-medium text-foreground">{to}</span> de{" "}
					<span className="font-medium text-foreground">{totalElements}</span>
				</p>
				<div className="flex items-center gap-2">
					<span id={sizeLabelId} className="whitespace-nowrap">
						Itens por página
					</span>
					<Select
						value={String(size)}
						onValueChange={(value) => onPageSizeChange(Number(value))}
						disabled={disabled}
					>
						<SelectTrigger size="sm" aria-labelledby={sizeLabelId} className="w-18">
							<SelectValue placeholder="Selecione" />
						</SelectTrigger>
						<SelectContent>
							<SelectPlaceholderItem>Itens por página</SelectPlaceholderItem>
							{pageSizeOptions.map((option) => (
								<SelectItem key={option} value={String(option)}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{totalPages > 1 && (
				<nav aria-label="Paginação" className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Primeira página"
						disabled={disabled || isFirst}
						onClick={() => onPageChange(0)}
					>
						<ChevronsLeft />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Página anterior"
						disabled={disabled || isFirst}
						onClick={() => onPageChange(current - 1)}
					>
						<ChevronLeft />
					</Button>

					{paginationRange(current, totalPages).map((item, index) =>
						item === "ellipsis" ? (
							// biome-ignore lint/suspicious/noArrayIndexKey: há no máximo duas reticências, distinguidas pela posição.
							<span key={`ellipsis-${index}`} className="px-1" aria-hidden="true">
								…
							</span>
						) : (
							<Button
								key={item}
								variant={item === current ? "default" : "ghost"}
								size="icon-sm"
								aria-label={`Página ${item + 1}`}
								aria-current={item === current ? "page" : undefined}
								disabled={disabled}
								onClick={() => onPageChange(item)}
								className={cn(item !== current && "text-foreground")}
							>
								{item + 1}
							</Button>
						),
					)}

					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Próxima página"
						disabled={disabled || isLast}
						onClick={() => onPageChange(current + 1)}
					>
						<ChevronRight />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Última página"
						disabled={disabled || isLast}
						onClick={() => onPageChange(totalPages - 1)}
					>
						<ChevronsRight />
					</Button>
				</nav>
			)}
		</div>
	);
}
