import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import type { PageMetadata } from "@/shared/types/pagination";

interface PaginationSummaryProps extends ComponentProps<"p"> {
	/** Metadados da página atual, como vêm do backend (página base 0). */
	page: PageMetadata;
}

/** Intervalo exibido e total, como "Mostrando 6–10 de 23". */
export function PaginationSummary({ page, className, ...props }: PaginationSummaryProps) {
	const { number: current, size, totalElements } = page;
	const from = totalElements === 0 ? 0 : current * size + 1;
	const to = Math.min((current + 1) * size, totalElements);

	return (
		<p className={cn("whitespace-nowrap", className)} {...props}>
			Mostrando <span className="font-medium text-foreground">{from}</span>–
			<span className="font-medium text-foreground">{to}</span> de{" "}
			<span className="font-medium text-foreground">{totalElements}</span>
		</p>
	);
}
