import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "neutral";

const toneClasses: Record<StatusTone, string> = {
	success: "bg-success-soft text-success ring-success/20",
	warning: "bg-warning-soft text-warning ring-warning/20",
	danger: "bg-destructive/10 text-destructive ring-destructive/20",
	neutral: "bg-muted text-muted-foreground ring-border",
};

interface StatusBadgeProps {
	tone: StatusTone;
	icon?: LucideIcon;
	children: ReactNode;
	className?: string;
}

/** Selo de status com cor e ícone, para que o significado não dependa apenas da cor. */
export function StatusBadge({ tone, icon: Icon, children, className }: StatusBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
				toneClasses[tone],
				className,
			)}
		>
			{Icon ? <Icon className="size-3.5" aria-hidden /> : null}
			{children}
		</span>
	);
}
