import { Clock, Loader2 } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MY_ACCESS_PATH, requestAccessPath } from "@/features/my-access/links";
import { useMyRoleRequests } from "@/features/role-requests/hooks";
import type { RoleRequest } from "@/features/role-requests/types";
import {
	type AccessRequirement,
	PERMISSION_REQUIREMENTS,
	type RequestableRequirement,
} from "../access";
import { useCurrentUser } from "../hooks";
import { isRoleAtLeast, ROLE_LABELS, resolveRole, roleLabel } from "../roles";
import type { Permission, Role } from "../types";

export const CHECKING_REQUESTS_MESSAGE = "Verificando seus pedidos…";
export const REQUEST_ACCESS_LABEL = "Pedir acesso";
export const VIEW_MY_REQUEST_LABEL = "Ver meu pedido";

const findPending = (requests: RoleRequest[] | undefined) =>
	requests?.find((request) => request.status === "PENDING");

/**
 * Explicação de uma funcionalidade bloqueada: o perfil atual, o necessário e, quando ele pode
 * ser pedido, o passo a passo (ou o pedido que já está em análise). Usada no modal e na tela
 * "Sem permissão".
 */
export function AccessExplanation({ permission }: { permission: Permission }) {
	const requirement = PERMISSION_REQUIREMENTS[permission];
	// A rota protegida só renderiza depois que o usuário carrega.
	const { data: currentUser } = useCurrentUser();

	return (
		<div className="grid gap-4 text-left">
			<RoleComparison currentRole={currentUser?.role ?? "VIEWER"} requirement={requirement} />
			{requirement.requestable ? (
				<RequestGuide requirement={requirement} />
			) : (
				<p className="text-sm text-muted-foreground">
					Esse perfil não pode ser pedido: o sistema tem um único administrador, responsável técnico
					por ele. Se precisar de algo desta área, fale com o administrador.
				</p>
			)}
		</div>
	);
}

/** Leva a Meu acesso: ao formulário com o perfil necessário, ou ao pedido já em análise. */
export function AccessPrimaryAction({
	permission,
	onNavigate,
}: {
	permission: Permission;
	onNavigate?: () => void;
}) {
	const requirement = PERMISSION_REQUIREMENTS[permission];
	const requests = useMyRoleRequests({ enabled: requirement.requestable });
	if (!requirement.requestable) return null;

	const hasPending = findPending(requests.data) !== undefined;
	return (
		<Button asChild>
			<Link
				to={hasPending ? MY_ACCESS_PATH : requestAccessPath(requirement.minimumRole)}
				onClick={onNavigate}
			>
				{hasPending ? VIEW_MY_REQUEST_LABEL : REQUEST_ACCESS_LABEL}
			</Link>
		</Button>
	);
}

function RoleComparison({
	currentRole,
	requirement,
}: {
	currentRole: Role;
	requirement: AccessRequirement;
}) {
	return (
		<dl className="grid gap-3 rounded-lg border bg-muted/40 p-3 text-sm sm:grid-cols-2">
			<div className="grid gap-0.5">
				<dt className="text-xs text-muted-foreground">Seu perfil</dt>
				<dd className="font-semibold">{ROLE_LABELS[currentRole]}</dd>
			</div>
			<div className="grid gap-0.5">
				<dt className="text-xs text-muted-foreground">Perfil necessário</dt>
				<dd className="font-semibold text-primary">
					{ROLE_LABELS[requirement.minimumRole]}
					{requirement.requestable && " ou superior"}
				</dd>
			</div>
		</dl>
	);
}

function RequestGuide({ requirement }: { requirement: RequestableRequirement }) {
	const requests = useMyRoleRequests();
	const headingId = useId();

	if (requests.isPending) {
		return (
			<div aria-busy="true" className="grid gap-2">
				<p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
					<Loader2 className="size-4 animate-spin" aria-hidden="true" />
					{CHECKING_REQUESTS_MESSAGE}
				</p>
				<Skeleton className="h-24 w-full" />
			</div>
		);
	}

	const pending = findPending(requests.data);
	if (pending) return <PendingRequestNotice request={pending} requirement={requirement} />;

	const requiredLabel = ROLE_LABELS[requirement.minimumRole];
	const steps = [
		`Clique em "${REQUEST_ACCESS_LABEL}" para abrir a tela Meu acesso.`,
		`Escolha o perfil ${requiredLabel}, que já vem marcado.`,
		"Explique na justificativa por que você precisa desse acesso.",
		"Envie o pedido. Quando o administrador aprovar, o novo perfil vale na hora, sem precisar entrar de novo.",
	];

	return (
		<section aria-labelledby={headingId} className="grid gap-2">
			<h3 id={headingId} className="text-sm font-semibold">
				Como pedir acesso
			</h3>
			<ol className="grid gap-2">
				{steps.map((step, index) => (
					<li key={step} className="flex items-start gap-3 text-sm">
						<span
							aria-hidden="true"
							className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
						>
							{index + 1}
						</span>
						<span className="pt-0.5">{step}</span>
					</li>
				))}
			</ol>
			{requests.isError && (
				<p className="text-xs text-muted-foreground">
					Não foi possível verificar se você já tem um pedido em análise. Se tiver, ele aparece em
					Meu acesso.
				</p>
			)}
		</section>
	);
}

function PendingRequestNotice({
	request,
	requirement,
}: {
	request: RoleRequest;
	requirement: RequestableRequirement;
}) {
	const covers = isRoleAtLeast(resolveRole([request.requestedRole]), requirement.minimumRole);
	return (
		<div className="flex gap-3 rounded-lg border border-warning/20 bg-warning-soft p-3 text-sm text-warning">
			<Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
			<p>
				Você já tem um pedido em análise para <strong>{roleLabel(request.requestedRole)}</strong>.{" "}
				{covers
					? "Quando o administrador aprovar, você poderá usar esta funcionalidade."
					: `Ele não inclui esta funcionalidade, que exige ${ROLE_LABELS[requirement.minimumRole]} ou superior. Em Meu acesso, você pode cancelar o pedido atual e fazer um novo.`}
			</p>
		</div>
	);
}
