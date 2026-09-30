import { Lock, type LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { type ActionLock, LOCKED_ACTION_CLASSES, lockedLabel } from "./action-lock";

interface LockableButtonProps extends Omit<ComponentProps<typeof Button>, "children" | "asChild"> {
	icon: LucideIcon;
	/** Texto do botão, também usado no nome acessível quando bloqueado. */
	label: string;
	/** Presente quando o perfil não pode usar a ação. */
	lock?: ActionLock;
}

/**
 * Botão que, sem permissão, aparece bloqueado. Usa `aria-disabled` em vez de `disabled` para
 * continuar recebendo foco, hover e clique: o tooltip mostra o motivo e o clique abre a
 * explicação, também no celular, onde não existe hover.
 */
export function LockableButton({
	icon: Icon,
	label,
	lock,
	onClick,
	className,
	...props
}: LockableButtonProps) {
	if (!lock) {
		return (
			<Button className={className} onClick={onClick} {...props}>
				<Icon aria-hidden="true" />
				{label}
			</Button>
		);
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					{...props}
					type="button"
					aria-disabled="true"
					aria-label={lockedLabel(label, lock.reason)}
					className={cn(LOCKED_ACTION_CLASSES, className)}
					onClick={lock.explain}
				>
					<Lock aria-hidden="true" />
					{label}
				</Button>
			</TooltipTrigger>
			<TooltipContent>{lock.reason}</TooltipContent>
		</Tooltip>
	);
}
