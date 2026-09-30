import type { ColumnDef } from "@tanstack/react-table";
import { Lock } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/DataTable";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ClearFiltersButton } from "@/components/filters/ClearFiltersButton";
import { FilterSelect } from "@/components/filters/FilterSelect";
import { SearchInput } from "@/components/filters/SearchInput";
import { FormField } from "@/components/form/FormField";
import { Card } from "@/components/ui/card";
import {
	ROLE_REQUEST_ERROR_MESSAGES,
	useChangeUserRole,
	useUsers,
} from "@/features/role-requests/hooks";
import type { ManagedUser } from "@/features/role-requests/types";
import { ASSIGNABLE_ROLES, ROLE_LABELS, resolveRole } from "@/features/session/roles";
import type { AssignableRole } from "@/features/session/types";
import { useDebouncedSearch } from "@/hooks/use-debounced-value";
import { getHttpErrorMessage } from "@/lib/api/errors";
import { formatCpfBr } from "@/shared/format/br-format";
import { matchesSearch } from "@/shared/format/search";
import { compareText } from "@/shared/sorting/sort";

export const USER_ROLE_CHANGED_MESSAGE = "Perfil alterado. A mudança já vale.";

const ROLE_OPTIONS = ASSIGNABLE_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));

const countLabel = (count: number) => (count === 1 ? "1 usuário" : `${count} usuários`);
const displayName = (user: ManagedUser) => user.name || user.email || `Usuário #${user.userId}`;

interface RoleChange {
	user: ManagedUser;
	role: AssignableRole;
}

export function UsersTab() {
	const users = useUsers();
	const changeRole = useChangeUserRole();
	const [searchInput, setSearchInput] = useState("");
	const search = useDebouncedSearch(searchInput);

	// O alvo é mantido após fechar para o conteúdo não mudar durante a animação de saída.
	const [change, setChange] = useState<RoleChange>();
	const [confirmOpen, setConfirmOpen] = useState(false);

	const resetChange = changeRole.reset;
	const askChange = useCallback(
		(user: ManagedUser, role: AssignableRole) => {
			resetChange();
			setChange({ user, role });
			setConfirmOpen(true);
		},
		[resetChange],
	);

	const confirmChange = () => {
		if (!change) return;
		changeRole.mutate(
			{ userId: change.user.userId, role: change.role },
			{
				onSuccess: () => {
					toast.success(USER_ROLE_CHANGED_MESSAGE);
					setConfirmOpen(false);
				},
			},
		);
	};

	const columns = useMemo<ColumnDef<ManagedUser>[]>(
		() => [
			{
				id: "name",
				header: "Nome",
				cell: ({ row }) => <span className="font-medium">{displayName(row.original)}</span>,
			},
			{
				id: "email",
				header: "E-mail",
				cell: ({ row }) => (
					<span className="text-muted-foreground">{row.original.email || "—"}</span>
				),
			},
			{
				id: "cpf",
				header: "CPF",
				meta: { className: "whitespace-nowrap" },
				cell: ({ row }) => (
					<span className="text-muted-foreground">{formatCpfBr(row.original.cpf) || "—"}</span>
				),
			},
			{
				id: "role",
				header: "Perfil",
				meta: { className: "w-64" },
				cell: ({ row }) => {
					const user = row.original;
					const role = resolveRole(user.roles.map(({ name }) => name));
					if (role === "ADMIN") {
						return (
							<span className="inline-flex items-center gap-2 text-sm font-medium">
								<Lock className="size-4 text-muted-foreground" aria-hidden="true" />
								{ROLE_LABELS.ADMIN}
							</span>
						);
					}
					return (
						<FilterSelect
							aria-label={`Perfil de ${displayName(user)}`}
							value={role}
							onChange={(next) => {
								if (next !== role) askChange(user, next);
							}}
							options={ROLE_OPTIONS}
						/>
					);
				},
			},
		],
		[askChange],
	);

	const all = users.data ?? [];
	const data = useMemo(
		() =>
			(users.data ?? [])
				.filter((user) => matchesSearch(search.applied, user.name, user.email, user.cpf))
				.sort((a, b) => compareText(displayName(a), displayName(b))),
		[users.data, search.applied],
	);
	const isFiltered = search.applied !== "";
	const total = isFiltered ? `${data.length} de ${countLabel(all.length)}` : countLabel(all.length);

	return (
		<Card className="gap-0 overflow-hidden py-0">
			<div className="flex flex-wrap items-end gap-4 border-b p-4">
				<FormField
					label="Buscar usuário"
					hint="Busque por nome, e-mail ou CPF"
					className="w-full sm:max-w-sm"
				>
					<SearchInput
						value={searchInput}
						onChange={(event) => setSearchInput(event.target.value)}
						placeholder="Ex.: Ana ou ana@hu.ufs.br"
						isBusy={search.isPending}
					/>
				</FormField>
			</div>

			<DataTable
				caption="Usuários do sistema"
				columns={columns}
				data={data}
				getRowId={(user) => String(user.userId)}
				isLoading={users.isPending}
				isError={users.isError}
				onRetry={() => users.refetch()}
				isRetrying={users.isFetching}
				skeletonRows={4}
				emptyState={
					isFiltered && all.length > 0 ? (
						<EmptyState
							title="Nenhum usuário encontrado"
							description="Nenhum usuário corresponde à busca."
							action={<ClearFiltersButton onClick={() => setSearchInput("")} />}
						/>
					) : (
						<EmptyState title="Nenhum usuário cadastrado" />
					)
				}
				header={data.length > 0 && <p>{total}</p>}
			/>

			<ConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				tone="default"
				title={`Alterar o perfil de ${change ? displayName(change.user) : ""}?`}
				description={
					change &&
					`O novo perfil, ${ROLE_LABELS[change.role]}, vale na hora. Se houver um pedido de acesso pendente dessa pessoa, ele é cancelado.`
				}
				confirmLabel="Alterar perfil"
				cancelLabel="Voltar"
				isPending={changeRole.isPending}
				error={
					changeRole.isError
						? getHttpErrorMessage(changeRole.error, ROLE_REQUEST_ERROR_MESSAGES.changeRole)
						: undefined
				}
				onConfirm={confirmChange}
			/>
		</Card>
	);
}
