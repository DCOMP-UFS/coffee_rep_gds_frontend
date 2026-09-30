import type { ColumnDef } from "@tanstack/react-table";
import { Clock, Crown, KeyRound, ShieldCheck, X } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/DataTable";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadErrorAlert } from "@/components/feedback/LoadErrorAlert";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	ROLE_REQUEST_ERROR_MESSAGES,
	useCancelRoleRequest,
	useMyRoleRequests,
} from "@/features/role-requests/hooks";
import { RoleRequestStatusBadge } from "@/features/role-requests/RoleRequestStatusBadge";
import type { RoleRequest } from "@/features/role-requests/types";
import { useCurrentUser } from "@/features/session/hooks";
import { RoleHierarchy } from "@/features/session/RoleHierarchy";
import {
	ADMIN_DESCRIPTION,
	ROLE_HIERARCHY,
	ROLE_LABELS,
	requestableRoles,
	roleLabel,
} from "@/features/session/roles";
import type { Role } from "@/features/session/types";
import { getHttpErrorMessage } from "@/lib/api/errors";
import { formatIsoDateTimeBr } from "@/shared/format/br-format";
import { requestedRoleFrom } from "./links";
import { RoleRequestForm } from "./RoleRequestForm";

export const ROLE_REQUEST_CANCELLED_MESSAGE = "Pedido cancelado.";
export const MY_REQUESTS_LOAD_ERROR = "Não foi possível carregar seus pedidos.";

const describeRole = (role: Role) =>
	role === "ADMIN"
		? ADMIN_DESCRIPTION.summary
		: ROLE_HIERARCHY.find((description) => description.role === role)?.summary;

export function MyAccessPage() {
	// A rota protegida só renderiza depois que o usuário carrega.
	const { data: currentUser } = useCurrentUser();
	const role = currentUser?.role ?? "VIEWER";
	const isAdmin = role === "ADMIN";

	return (
		<>
			<PageHeader
				icon={KeyRound}
				title="Meu acesso"
				description="Veja o que o seu perfil permite e peça um nível maior quando precisar."
			/>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
				<div className="grid content-start gap-6">
					<Card>
						<CardHeader>
							<CardDescription>Seu perfil atual</CardDescription>
							<CardTitle className="flex items-center gap-2 text-xl text-primary">
								{isAdmin && <Crown className="size-5 text-warning" aria-hidden="true" />}
								{ROLE_LABELS[role]}
							</CardTitle>
							<p className="text-sm text-muted-foreground">{describeRole(role)}</p>
						</CardHeader>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Níveis de acesso</CardTitle>
							<CardDescription>Cada nível inclui tudo o que o anterior permite.</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-3">
							<RoleHierarchy currentRole={isAdmin ? undefined : role} />
							<p className="text-xs text-muted-foreground">
								O {ROLE_LABELS.ADMIN} é único e fica fora desta hierarquia: é ele quem aprova os
								pedidos de acesso.
							</p>
						</CardContent>
					</Card>
				</div>

				<div className="grid content-start gap-6">
					{isAdmin ? <AdminNotice /> : <RequestAccessCard role={role} />}
				</div>
			</div>

			{!isAdmin && <RequestHistory />}
		</>
	);
}

function AdminNotice() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ShieldCheck className="size-5 text-success" aria-hidden="true" />
					Você já tem todas as permissões
				</CardTitle>
				<CardDescription>
					Como administrador de tecnologia, você não precisa pedir acesso. Os pedidos dos outros
					usuários chegam em Administração, onde você também pode alterar perfis.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button asChild>
					<Link to="/admin">Ir para Administração</Link>
				</Button>
			</CardContent>
		</Card>
	);
}

function RequestAccessCard({ role }: { role: Role }) {
	const requests = useMyRoleRequests();
	const pending = requests.data?.find((request) => request.status === "PENDING");
	const roles = requestableRoles(role);
	const [searchParams] = useSearchParams();
	const initialRole = requestedRoleFrom(searchParams, roles);

	let content: ReactNode;
	if (requests.isPending) {
		content = (
			<div aria-busy="true" className="grid gap-3">
				<span className="sr-only" role="status">
					Carregando…
				</span>
				<Skeleton className="h-16 w-full" />
				<Skeleton className="h-24 w-full" />
			</div>
		);
	} else if (requests.isError) {
		content = (
			<LoadErrorAlert
				message={MY_REQUESTS_LOAD_ERROR}
				onRetry={() => requests.refetch()}
				isRetrying={requests.isFetching}
			/>
		);
	} else if (pending) {
		content = <PendingRequest request={pending} />;
	} else if (roles.length === 0) {
		content = (
			<p className="text-sm text-muted-foreground">
				Você já está no maior nível da hierarquia. Se precisar de algo além disso, fale com o
				administrador de tecnologia.
			</p>
		);
	} else {
		content = <RoleRequestForm key={initialRole} roles={roles} initialRole={initialRole} />;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Pedir mais acesso</CardTitle>
				<CardDescription>
					O pedido vai para o administrador de tecnologia. Quando ele aprovar, o novo perfil vale na
					hora, sem precisar entrar de novo.
				</CardDescription>
			</CardHeader>
			<CardContent>{content}</CardContent>
		</Card>
	);
}

function PendingRequest({ request }: { request: RoleRequest }) {
	const cancel = useCancelRoleRequest();
	const [confirmOpen, setConfirmOpen] = useState(false);

	const confirmCancel = () =>
		cancel.mutate(request.id, {
			onSuccess: () => {
				toast.success(ROLE_REQUEST_CANCELLED_MESSAGE);
				setConfirmOpen(false);
			},
		});

	return (
		<section aria-label="Pedido em análise" className="grid gap-3">
			<div className="flex gap-3 rounded-lg border border-warning/20 bg-warning-soft p-3 text-sm text-warning">
				<Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
				<p>
					Seu pedido para <strong>{roleLabel(request.requestedRole)}</strong> está em análise
					{request.createdAt ? ` desde ${formatIsoDateTimeBr(request.createdAt)}` : ""}.
				</p>
			</div>
			<dl className="grid gap-1 text-sm">
				<dt className="text-xs text-muted-foreground">Justificativa</dt>
				<dd className="whitespace-pre-line wrap-break-word">{request.justification}</dd>
			</dl>
			<Button
				variant="outline"
				className="justify-self-start"
				onClick={() => {
					cancel.reset();
					setConfirmOpen(true);
				}}
			>
				<X aria-hidden="true" />
				Cancelar pedido
			</Button>

			<ConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title="Cancelar o pedido de acesso?"
				description="Você poderá fazer um novo pedido depois."
				confirmLabel="Cancelar pedido"
				cancelLabel="Voltar"
				isPending={cancel.isPending}
				error={
					cancel.isError
						? getHttpErrorMessage(cancel.error, ROLE_REQUEST_ERROR_MESSAGES.cancel)
						: undefined
				}
				onConfirm={confirmCancel}
			/>
		</section>
	);
}

function RequestHistory() {
	const requests = useMyRoleRequests();

	const columns = useMemo<ColumnDef<RoleRequest>[]>(
		() => [
			{
				id: "createdAt",
				header: "Data",
				meta: { className: "whitespace-nowrap" },
				cell: ({ row }) => formatIsoDateTimeBr(row.original.createdAt) || "—",
			},
			{
				id: "requestedRole",
				header: "Perfil pedido",
				cell: ({ row }) => (
					<span className="font-medium">{roleLabel(row.original.requestedRole)}</span>
				),
			},
			{
				id: "status",
				header: "Situação",
				cell: ({ row }) => <RoleRequestStatusBadge status={row.original.status} />,
			},
			{
				id: "reviewNote",
				header: "Resposta",
				cell: ({ row }) => (
					<span className="text-muted-foreground">{row.original.reviewNote || "—"}</span>
				),
			},
		],
		[],
	);

	return (
		<Card className="gap-0 overflow-hidden py-0">
			<CardHeader className="border-b py-4">
				<CardTitle>Histórico de pedidos</CardTitle>
			</CardHeader>
			<DataTable
				caption="Seus pedidos de acesso"
				columns={columns}
				data={requests.data ?? []}
				getRowId={(request) => String(request.id)}
				isLoading={requests.isPending}
				isError={requests.isError}
				onRetry={() => requests.refetch()}
				isRetrying={requests.isFetching}
				skeletonRows={3}
				emptyState={
					<EmptyState
						title="Nenhum pedido ainda"
						description="Os pedidos que você fizer aparecem aqui, com a resposta do administrador."
					/>
				}
			/>
		</Card>
	);
}
