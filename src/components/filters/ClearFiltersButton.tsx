import { FilterX } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ClearFiltersButtonProps = Omit<ComponentProps<typeof Button>, "children" | "type" | "variant">;

/** Volta todos os filtros e a ordenação ao padrão da tela. */
export function ClearFiltersButton({ className, ...props }: ClearFiltersButtonProps) {
	return (
		<Button
			type="button"
			variant="secondary"
			className={cn("border border-input shadow-xs", className)}
			{...props}
		>
			<FilterX aria-hidden="true" />
			Limpar filtros
		</Button>
	);
}
