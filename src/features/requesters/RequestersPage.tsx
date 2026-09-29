import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, Plus, Search, UserRound, X } from "lucide-react";
import { type FormEvent, useCallback, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/DataTable";
import { PaginationBar } from "@/components/data-table/PaginationBar";
import { RowActions } from "@/components/data-table/RowActions";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClampPage } from "@/hooks/use-clamp-page";
import { getHttpErrorMessage } from "@/lib/api/errors";
import { formatPhoneBr } from "@/shared/format/br-format";
import { REQUESTER_ERROR_MESSAGES, useDeleteRequester, useRequesters } from "./hooks";
import { RequesterFormDialog } from "./RequesterFormDialog";
import type { Requester } from "./types";

export const REQUESTER_DELETED_MESSAGE = "Solicitante excluído com sucesso.";
const PAGE_SIZE_OPTIONS = [5, 10] as const;
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

export function RequestersPage() {
	const searchId = useId();
	const searchHintId = useId();

	// O termo digitado só vale depois de enviado, como no Angular: evita uma requisição por
	// tecla e deixa claro o que está sendo buscado.
	const [draft, setDraft] = useState("");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);

	const requesters = useRequesters({ search, page, size });
	const deleteRequester = useDeleteRequester();

	// O alvo é mantido após fechar para o conteúdo não mudar durante a animação de saída.
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Requester>();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleting, setDeleting] = useState<Requester>();

	const pageInfo = requesters.data?.page;
	const data = requesters.data?.content ?? [];
	const hasSearch = search !== "";
	const isSearching = requesters.isPlaceholderData;

	useClampPage({ page, pageInfo, isPlaceholderData: requesters.isPlaceholderData, setPage });

	const applySearch = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const term = draft.trim();
		if (term === search && page === 0) {
			requesters.refetch();
			return;
		}
		setSearch(term);
		setPage(0);
	};

	const clearSearch = () => {
		setDraft("");
		setSearch("");
		setPage(0);
	};

	const openForm = useCallback((requester?: Requester) => {
		setEditing(requester);
		setFormOpen(true);
	}, []);

	const resetDelete = deleteRequester.reset;
	const askDelete = useCallback(
		(requester: Requester) => {
			resetDelete();
			setDeleting(requester);
			setConfirmOpen(true);
		},
		[resetDelete],
	);

	const confirmDelete = () => {
		if (!deleting) return;
		deleteRequester.mutate(deleting.id, {
			onSuccess: () => {
				toast.success(REQUESTER_DELETED_MESSAGE);
				setConfirmOpen(false);
			},
		});
	};

	const columns = useMemo<ColumnDef<Requester>[]>(
		() => [
			{
				accessorKey: "nome",
				header: "Nome",
				cell: ({ row }) => <span className="font-medium">{row.original.nome}</span>,
			},
			{
				id: "telefone",
				header: "Telefone",
				meta: { className: "whitespace-nowrap" },
				cell: ({ row }) => (
					<span className="text-muted-foreground">
						{formatPhoneBr(row.original.contato) || "—"}
					</span>
				),
			},
			{
				id: "especialidade",
				header: "Especialidade",
				cell: ({ row }) => (
					<span className="text-muted-foreground">{row.original.especialidade || "—"}</span>
				),
			},
			{
				id: "actions",
				header: () => <span className="sr-only md:not-sr-only">Ações</span>,
				meta: { className: "w-28 text-right" },
				cell: ({ row }) => (
					<RowActions
						editLabel={`Editar solicitante ${row.original.nome}`}
						deleteLabel={`Excluir solicitante ${row.original.nome}`}
						onEdit={() => openForm(row.original)}
						onDelete={() => askDelete(row.original)}
					/>
				),
			},
		],
		[openForm, askDelete],
	);

	const newRequesterButton = (
		<Button onClick={() => openForm()}>
			<Plus aria-hidden="true" />
			Novo solicitante
		</Button>
	);

	return (
		<>
			<PageHeader
				icon={UserRound}
				title="Solicitantes"
				description="Profissionais que reservam salas e podem ter ausências registradas."
				actions={newRequesterButton}
			/>

			<Card className="gap-0 overflow-hidden py-0">
				<search className="border-b p-4">
					<form className="flex flex-col gap-3 sm:flex-row sm:items-start" onSubmit={applySearch}>
						<div className="grid gap-1.5 sm:w-96">
							<Label htmlFor={searchId}>Buscar solicitante</Label>
							<Input
								id={searchId}
								type="search"
								value={draft}
								onChange={(event) => setDraft(event.target.value)}
								placeholder="Ex.: Ana, Cardiologia ou 79999"
								autoComplete="off"
								aria-describedby={searchHintId}
							/>
							<p id={searchHintId} className="text-xs text-muted-foreground">
								Busque por nome, telefone ou especialidade
							</p>
						</div>
						<div className="flex gap-2 sm:mt-5">
							<Button type="submit" variant="outline" disabled={isSearching}>
								{isSearching ? (
									<Loader2 className="animate-spin" aria-hidden="true" />
								) : (
									<Search aria-hidden="true" />
								)}
								{isSearching ? "Buscando…" : "Buscar"}
							</Button>
							{hasSearch && (
								<Button type="button" variant="ghost" onClick={clearSearch}>
									<X aria-hidden="true" />
									Limpar busca
								</Button>
							)}
						</div>
					</form>
				</search>

				<DataTable
					caption="Solicitantes cadastrados"
					columns={columns}
					data={data}
					getRowId={(requester) => String(requester.id)}
					isLoading={requesters.isPending}
					isError={requesters.isError}
					onRetry={() => requesters.refetch()}
					isRetrying={requesters.isFetching}
					isPlaceholderData={requesters.isPlaceholderData}
					skeletonRows={size}
					emptyState={
						hasSearch ? (
							<EmptyState
								title="Nenhum solicitante encontrado"
								description="Tente outro termo de busca."
								action={
									<Button variant="outline" onClick={clearSearch}>
										<X aria-hidden="true" />
										Limpar busca
									</Button>
								}
							/>
						) : (
							<EmptyState
								title="Nenhum solicitante cadastrado"
								description="Cadastre solicitantes para vincular às reservas."
								action={newRequesterButton}
							/>
						)
					}
					footer={
						pageInfo &&
						data.length > 0 && (
							<PaginationBar
								page={pageInfo}
								pageSizeOptions={PAGE_SIZE_OPTIONS}
								onPageChange={setPage}
								onPageSizeChange={(value) => {
									setSize(value);
									setPage(0);
								}}
								disabled={requesters.isPlaceholderData}
							/>
						)
					}
				/>
			</Card>

			<RequesterFormDialog open={formOpen} onOpenChange={setFormOpen} requester={editing} />

			<ConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title={`Excluir o solicitante “${deleting?.nome ?? ""}”?`}
				isPending={deleteRequester.isPending}
				error={
					deleteRequester.isError
						? getHttpErrorMessage(deleteRequester.error, REQUESTER_ERROR_MESSAGES.remove)
						: undefined
				}
				onConfirm={confirmDelete}
			/>
		</>
	);
}
