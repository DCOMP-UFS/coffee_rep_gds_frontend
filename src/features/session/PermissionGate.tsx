import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePermission } from "./hooks";
import type { Permission } from "./types";

export const FORBIDDEN_TITLE = "Sem permissão";

/** Rota que exige uma permissão; sem ela, explica o motivo em vez de mostrar a tela. */
export function PermissionGate({
	permission,
	children,
}: {
	permission: Permission;
	children: ReactNode;
}) {
	return usePermission(permission) ? children : <ForbiddenPage />;
}

function ForbiddenPage() {
	return (
		<section className="flex flex-col items-center gap-4 px-6 py-16 text-center animate-in fade-in">
			<span className="flex size-14 items-center justify-center rounded-full bg-warning-soft text-warning">
				<ShieldAlert className="size-7" aria-hidden="true" />
			</span>
			<h1 className="text-2xl font-bold text-primary">{FORBIDDEN_TITLE}</h1>
			<p className="max-w-md text-sm text-muted-foreground">
				Seu perfil não dá acesso a esta tela. Se precisar dela no seu trabalho, peça um nível de
				acesso maior.
			</p>
			<div className="flex flex-wrap justify-center gap-2">
				<Button asChild>
					<Link to="/meu-acesso">Ver meu acesso</Link>
				</Button>
				<Button asChild variant="outline">
					<Link to="/rooms">Voltar para o início</Link>
				</Button>
			</div>
		</section>
	);
}
