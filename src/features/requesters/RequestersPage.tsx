import type { ColumnDef } from "@tanstack/react-table";
import { Plus, UserRound } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { LockableButton } from "@/components/actions/LockableButton";
import { DataTable } from "@/components/data-table/DataTable";
import { PaginationBar } from "@/components/data-table/PaginationBar";
import { PaginationSummary } from "@/components/data-table/PaginationSummary";
import { actionsColumn, RowActions } from "@/components/data-table/RowActions";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ClearFiltersButton } from "@/components/filters/ClearFiltersButton";
import { FilterBar } from "@/components/filters/FilterBar";
import { FilterSelect } from "@/components/filters/FilterSelect";
import { SearchInput } from "@/components/filters/SearchInput";
import { FormField } from "@/components/form/FormField";
import { SearchableSelect } from "@/components/form/SearchableSelect";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAccess } from "@/features/session/access-dialog/useAccess";
import { useClampPage } from "@/hooks/use-clamp-page";
import { useDebouncedSearch } from "@/hooks/use-debounced-value";
import { useFilteredPage } from "@/hooks/use-filtered-page";
import { getHttpErrorMessage } from "@/lib/api/errors";
import { formatPhoneBr } from "@/shared/format/br-format";
import {
	ALL_SPECIALTIES_OPTION,
	DEFAULT_REQUESTER_FILTERS,
	hasActiveRequesterFilters,
	REQUESTER_SORT_OPTIONS,
	type RequesterFilters,
	type RequesterSort,
	specialtyOptions,
	toRequesterListFilters,
} from "./filters";
import {
	REQUESTER_ERROR_MESSAGES,
	useAllRequesters,
	useDeleteRequester,
	useRequesters,
} from "./hooks";
import { RequesterFormDialog } from "./RequesterFormDialog";
import type { Requester } from "./types";

export const REQUESTER_DELETED_MESSAGE = "Solicitante excluído com sucesso.";
export const SPECIALTIES_LOAD_ERROR_MESSAGE = "Não foi possível carregar as especialidades.";
const PAGE_SIZE_OPTIONS = [5, 10] as const;
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

export function RequestersPage() {
	const { lock } = useAccess("catalog.manage", "Cadastrar, editar e excluir solicitantes");
	const [searchInput, setSearchInput] = useState(DEFAULT_REQUESTER_FILTERS.search);
	const [specialty, setSpecialty] = useState(DEFAULT_REQUESTER_FILTERS.specialty);
	const [sort, setSort] = useState<RequesterSort>(DEFAULT_REQUESTER_FILTERS.sort);
	const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);
	const search = useDebouncedSearch(searchInput);

	const filters: RequesterFilters = { search: search.applied, specialty, sort };
	const [page, setPage] = useFilteredPage(filters);
	const requesters = useRequesters(toRequesterListFilters(filters, page, size));
	const allRequesters = useAllRequesters();
	const deleteRequester = useDeleteRequester();

	// O alvo é mantido após fechar para o conteúdo não mudar durante a animação de saída.
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Requester>();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleting, setDeleting] = useState<Requester>();

	const pageInfo = requesters.data?.page;
	const data = requesters.data?.content ?? [];
	const hasFilters = hasActiveRequesterFilters(filters);
	const canClear =
		hasActiveRequesterFilters({ ...filters, search: searchInput }) ||
		sort !== DEFAULT_REQUESTER_FILTERS.sort;
	const specialties = useMemo(
		() => (allRequesters.data ? specialtyOptions(allRequesters.data) : []),
		[allRequesters.data],
	);

	useClampPage({ page, pageInfo, isPlaceholderData: requesters.isPlaceholderData, setPage });

	const clearFilters = () => {
		setSearchInput(DEFAULT_REQUESTER_FILTERS.search);
		setSpecialty(DEFAULT_REQUESTER_FILTERS.specialty);
		setSort(DEFAULT_REQUESTER_FILTERS.sort);
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
			...actionsColumn<Requester>((requester) => (
				<RowActions
					editLabel={`Editar solicitante ${requester.nome}`}
					deleteLabel={`Excluir solicitante ${requester.nome}`}
					lock={lock}
					onEdit={() => openForm(requester)}
					onDelete={() => askDelete(requester)}
				/>
			)),
		],
		[lock, openForm, askDelete],
	);

	const newRequesterButton = (
		<LockableButton icon={Plus} label="Novo solicitante" lock={lock} onClick={() => openForm()} />
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
				<FilterBar
					label="Filtros dos solicitantes"
					search={
						<FormField label="Buscar solicitante" hint="Busque por nome, telefone ou especialidade">
							<SearchInput
								value={searchInput}
								onChange={(event) => setSearchInput(event.target.value)}
								placeholder="Ex.: Ana, Cardiologia ou 79999"
								isBusy={search.isPending || requesters.isPlaceholderData}
							/>
						</FormField>
					}
					onClear={clearFilters}
					canClear={canClear}
				>
					<div className="flex w-full items-start gap-2 sm:w-auto">
						<FormField
							label="Especialidade"
							error={allRequesters.isError ? SPECIALTIES_LOAD_ERROR_MESSAGE : undefined}
							className="w-full sm:w-60"
						>
							<SearchableSelect
								options={specialties}
								value={specialty || ALL_SPECIALTIES_OPTION}
								onChange={(value) => setSpecialty(value === ALL_SPECIALTIES_OPTION ? "" : value)}
								disabled={!allRequesters.data}
								placeholder={
									allRequesters.isPending
										? "Carregando especialidades…"
										: "Selecione a especialidade"
								}
								searchPlaceholder="Pesquisar especialidade..."
							/>
						</FormField>
						{allRequesters.isError && (
							<Button
								type="button"
								variant="outline"
								className="mt-5.5"
								onClick={() => allRequesters.refetch()}
								disabled={allRequesters.isFetching}
							>
								Tentar novamente
							</Button>
						)}
					</div>
					<FormField label="Ordenar por" className="w-full sm:w-48">
						<FilterSelect value={sort} onChange={setSort} options={REQUESTER_SORT_OPTIONS} />
					</FormField>
				</FilterBar>

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
						hasFilters ? (
							<EmptyState
								title="Nenhum solicitante encontrado"
								description="Nenhum solicitante corresponde aos filtros escolhidos. Ajuste os filtros ou cadastre um novo solicitante."
								action={<ClearFiltersButton onClick={clearFilters} />}
							/>
						) : (
							<EmptyState
								title="Nenhum solicitante cadastrado"
								description="Cadastre solicitantes para vincular às reservas."
								action={newRequesterButton}
							/>
						)
					}
					header={pageInfo && data.length > 0 && <PaginationSummary page={pageInfo} />}
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
