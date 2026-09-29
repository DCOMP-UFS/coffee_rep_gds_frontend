import type { ReactNode } from "react";
import { illustrations } from "@/assets/illustrations";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
	title: string;
	description?: ReactNode;
	action?: ReactNode;
	className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center gap-3 px-6 py-12 text-center animate-in fade-in",
				className,
			)}
		>
			<img src={illustrations.emptyState} alt="" className="h-36 w-auto select-none" />
			<h2 className="text-lg font-semibold text-primary">{title}</h2>
			{description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
			{action && <div className="mt-2">{action}</div>}
		</div>
	);
}
