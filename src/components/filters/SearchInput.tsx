import { Loader2, Search } from "lucide-react";
import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const SEARCHING_MESSAGE = "Buscando…";

interface SearchInputProps extends Omit<ComponentProps<"input">, "type"> {
	/** Busca aguardando o fim da digitação ou resultado a caminho. */
	isBusy?: boolean;
}

/** Campo da busca livre, com lupa e um indicador de carregamento anunciado a leitores de tela. */
export function SearchInput({ isBusy = false, className, ...props }: SearchInputProps) {
	return (
		<div className="relative">
			<Search
				className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
				aria-hidden="true"
			/>
			<Input type="search" autoComplete="off" className={cn("pr-9 pl-9", className)} {...props} />
			{isBusy && (
				<Loader2
					className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
					aria-hidden="true"
				/>
			)}
			<span role="status" className="sr-only">
				{isBusy ? SEARCHING_MESSAGE : ""}
			</span>
		</div>
	);
}
