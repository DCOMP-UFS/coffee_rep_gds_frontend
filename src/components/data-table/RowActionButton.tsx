import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RowActionButtonProps {
	icon: LucideIcon;
	/** Nome acessível completo, ex.: "Excluir sala Sala 01". */
	label: string;
	/** Texto curto do tooltip, ex.: "Excluir". */
	tooltip: string;
	destructive?: boolean;
	onClick: () => void;
}

/** Botão de ícone de uma linha de tabela, com tooltip e nome acessível. */
export function RowActionButton({
	icon: Icon,
	label,
	tooltip,
	destructive = false,
	onClick,
}: RowActionButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					className={cn(
						destructive && "text-destructive hover:bg-destructive/10 hover:text-destructive",
					)}
					aria-label={label}
					onClick={onClick}
				>
					<Icon />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	);
}
