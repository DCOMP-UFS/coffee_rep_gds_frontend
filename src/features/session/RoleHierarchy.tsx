import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_HIERARCHY, ROLE_LABELS } from "./roles";
import type { Role } from "./types";

interface RoleHierarchyProps {
	/** Destaca o perfil do usuário. */
	currentRole?: Role;
	/** Só nome e resumo de cada nível, sem a lista do que cada um pode fazer. */
	compact?: boolean;
	className?: string;
}

/** Níveis de acesso, do menor para o maior, cada um incluindo o anterior. */
export function RoleHierarchy({ currentRole, compact = false, className }: RoleHierarchyProps) {
	return (
		<ol aria-label="Níveis de acesso" className={cn("grid gap-3", className)}>
			{ROLE_HIERARCHY.map(({ role, summary, capabilities }, index) => {
				const isCurrent = role === currentRole;
				return (
					<li
						key={role}
						aria-current={isCurrent ? "true" : undefined}
						className={cn(
							"flex gap-3 rounded-lg border bg-card p-3",
							isCurrent && "border-brand-blue/40 bg-accent/60 ring-1 ring-brand-blue/20",
						)}
					>
						<span
							aria-hidden="true"
							className={cn(
								"flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground",
								isCurrent && "bg-primary text-primary-foreground",
							)}
						>
							{index + 1}
						</span>
						<div className="grid gap-1">
							<p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
								{ROLE_LABELS[role]}
								{isCurrent && (
									<span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
										Seu perfil
									</span>
								)}
							</p>
							<p className="text-sm text-muted-foreground">{summary}</p>
							{!compact && (
								<ul className="mt-1 grid gap-1 text-sm">
									{capabilities.map((capability) => (
										<li key={capability} className="flex items-start gap-2">
											<Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
											{capability}
										</li>
									))}
								</ul>
							)}
						</div>
					</li>
				);
			})}
		</ol>
	);
}
