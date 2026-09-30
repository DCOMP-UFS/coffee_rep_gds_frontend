import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MY_ACCESS_PATH } from "@/features/my-access/links";
import { accessSummary, PERMISSION_REQUIREMENTS } from "./access";
import { AccessExplanation, AccessPrimaryAction } from "./access-dialog/AccessExplanation";
import { usePermission } from "./hooks";
import type { Permission } from "./types";

export const FORBIDDEN_TITLE = "Sem permissão";

interface PermissionGateProps {
	permission: Permission;
	/** O que a tela permite fazer, no infinitivo, ex.: "Administrar usuários". */
	feature: string;
	children: ReactNode;
}

/** Rota que exige uma permissão; sem ela, explica o motivo e como pedir acesso. */
export function PermissionGate({ permission, feature, children }: PermissionGateProps) {
	return usePermission(permission) ? (
		children
	) : (
		<ForbiddenPage permission={permission} feature={feature} />
	);
}

function ForbiddenPage({ permission, feature }: Omit<PermissionGateProps, "children">) {
	const requirement = PERMISSION_REQUIREMENTS[permission];
	return (
		<section className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-16 text-center animate-in fade-in">
			<span className="flex size-14 items-center justify-center rounded-full bg-warning-soft text-warning">
				<ShieldAlert className="size-7" aria-hidden="true" />
			</span>
			<h1 className="text-2xl font-bold text-primary">{FORBIDDEN_TITLE}</h1>
			<p className="text-sm text-muted-foreground">{accessSummary(feature, requirement)}</p>
			<div className="w-full">
				<AccessExplanation permission={permission} />
			</div>
			<div className="flex flex-wrap justify-center gap-2">
				<AccessPrimaryAction permission={permission} />
				<Button asChild variant={requirement.requestable ? "outline" : "default"}>
					<Link to={MY_ACCESS_PATH}>Ver meu acesso</Link>
				</Button>
				<Button asChild variant="outline">
					<Link to="/rooms">Voltar para o início</Link>
				</Button>
			</div>
		</section>
	);
}
