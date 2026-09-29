import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
	icon: LucideIcon;
	title: string;
	description?: string;
	/** Botões de ação principais da página, alinhados à direita. */
	actions?: ReactNode;
}

export function PageHeader({ icon: Icon, title, description, actions }: PageHeaderProps) {
	return (
		<header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-center gap-4">
				<span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm ring-1 ring-brand-blue/10">
					<Icon className="size-6" aria-hidden />
				</span>
				<div>
					<h1 className="text-2xl font-bold text-primary">{title}</h1>
					{description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
				</div>
			</div>
			{actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
		</header>
	);
}
