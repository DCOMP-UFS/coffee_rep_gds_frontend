import type { LucideIcon } from "lucide-react";
import {
	type ActionLock,
	LOCKED_ACTION_CLASSES,
	lockedLabel,
} from "@/components/actions/action-lock";
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
	/** Presente quando o perfil não pode usar a ação: ela aparece bloqueada e explica o motivo. */
	lock?: ActionLock;
	onClick: () => void;
}

/** Botão de ícone de uma linha de tabela, com tooltip e nome acessível. */
export function RowActionButton({
	icon: Icon,
	label,
	tooltip,
	destructive = false,
	lock,
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
						lock && LOCKED_ACTION_CLASSES,
					)}
					aria-label={lock ? lockedLabel(label, lock.reason) : label}
					aria-disabled={lock ? "true" : undefined}
					onClick={lock ? lock.explain : onClick}
				>
					<Icon />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{lock ? lockedLabel(tooltip, lock.reason) : tooltip}</TooltipContent>
		</Tooltip>
	);
}
