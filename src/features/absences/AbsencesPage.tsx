import type { ColumnDef } from "@tanstack/react-table";
import { CalendarX2, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { LockableButton } from "@/components/actions/LockableButton";
import { DataTable } from "@/components/data-table/DataTable";
import { actionsColumn, RowActions } from "@/components/data-table/RowActions";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ClearFiltersButton } from "@/components/filters/ClearFiltersButton";
import { FilterBar } from "@/components/filters/FilterBar";
import { FilterSelect } from "@/components/filters/FilterSelect";
import { SearchInput } from "@/components/filters/SearchInput";
import { FormField } from "@/components/form/FormField";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { toIsoDate } from "@/features/calendar/month-grid";
import { useAllRequesters } from "@/features/requesters/hooks";
import { useAccess } from "@/features/session/access-dialog/useAccess";
import { useDebouncedSearch } from "@/hooks/use-debounced-value";
import { getHttpErrorMessage } from "@/lib/api/errors";
import { formatIsoDateBr } from "@/shared/format/br-format";
import { AbsenceFormDialog } from "./AbsenceFormDialog";
import {
	ABSENCE_SORT_OPTIONS,
	ABSENCE_STATUS_OPTIONS,
	type AbsenceSort,
	type AbsenceStatus,
	DEFAULT_ABSENCE_FILTERS,
	filterAbsences,
	hasActiveAbsenceFilters,
} from "./filters";
import { ABSENCE_ERROR_MESSAGES, useAbsences, useDeleteAbsence } from "./hooks";
import type { Absence } from "./types";

export const ABSENCE_DELETED_MESSAGE = "Ausência removida.";

const formatDate = (value: string | null | undefined) => formatIsoDateBr(value) || "—";

const countLabel = (count: number) => (count === 1 ? "1 ausência" : `${count} ausências`);

/** Nome acessível que distingue ausências do mesmo profissional pelo período. */
const describeAbsence = (absence: Absence) =>
	`${absence.solicitanteNome} (${formatDate(absence.dataInicio)} a ${formatDate(absence.dataFim)})`;

export function AbsencesPage() {
	const { lock } = useAccess("absence.manage", "Registrar, editar e remover ausências");
	const absences = useAbsences();
	const requesters = useAllRequesters();
	const deleteAbsence = useDeleteAbsence();

	const [searchInput, setSearchInput] = useState(DEFAULT_ABSENCE_FILTERS.search);
	const [status, setStatus] = useState<AbsenceStatus | "">(DEFAULT_ABSENCE_FILTERS.status);
	const [sort, setSort] = useState<AbsenceSort>(DEFAULT_ABSENCE_FILTERS.sort);
	const search = useDebouncedSearch(searchInput);

	// O alvo é mantido após fechar para o conteúdo não mudar durante a animação de saída.
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Absence>();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleting, setDeleting] = useState<Absence>();

	const openForm = useCallback((absence?: Absence) => {
		setEditing(absence);
		setFormOpen(true);
	}, []);

	const resetDelete = deleteAbsence.reset;
	const askDelete = useCallback(
		(absence: Absence) => {
			resetDelete();
			setDeleting(absence);
			setConfirmOpen(true);
		},
		[resetDelete],
	);

	const confirmDelete = () => {
		if (!deleting) return;
		deleteAbsence.mutate(deleting.id, {
			onSuccess: () => {
				toast.success(ABSENCE_DELETED_MESSAGE);
				setConfirmOpen(false);
			},
		});
	};

	const columns = useMemo<ColumnDef<Absence>[]>(
		() => [
			{
				accessorKey: "solicitanteNome",
				header: "Profissional",
				cell: ({ row }) => (
					<span className="font-medium">{row.original.solicitanteNome || "—"}</span>
				),
			},
			{
				id: "dataInicio",
				header: "Início",
				meta: { className: "whitespace-nowrap" },
				cell: ({ row }) => (
					<span className="text-muted-foreground">{formatDate(row.original.dataInicio)}</span>
				),
			},
			{
				id: "dataFim",
				header: "Fim",
				meta: { className: "whitespace-nowrap" },
				cell: ({ row }) => (
					<span className="text-muted-foreground">{formatDate(row.original.dataFim)}</span>
				),
			},
			...actionsColumn<Absence>((absence) => (
				<RowActions
					editLabel={`Editar ausência de ${describeAbsence(absence)}`}
					deleteLabel={`Excluir ausência de ${describeAbsence(absence)}`}
					lock={lock}
					onEdit={() => openForm(absence)}
					onDelete={() => askDelete(absence)}
				/>
			)),
		],
		[lock, openForm, askDelete],
	);

	const clearFilters = () => {
		setSearchInput(DEFAULT_ABSENCE_FILTERS.search);
		setStatus(DEFAULT_ABSENCE_FILTERS.status);
		setSort(DEFAULT_ABSENCE_FILTERS.sort);
	};

	// A situação é calculada no dia local do navegador, como as datas exibidas.
	const today = toIsoDate(new Date());
	const allCount = absences.data?.length ?? 0;
	const isFiltered = hasActiveAbsenceFilters({ search: search.applied, status, sort });
	const data = useMemo(
		() => filterAbsences(absences.data ?? [], { search: search.applied, status, sort }, today),
		[absences.data, search.applied, status, sort, today],
	);
	const total = isFiltered ? `${data.length} de ${countLabel(allCount)}` : countLabel(allCount);
	const canClear =
		searchInput.trim() !== "" ||
		status !== DEFAULT_ABSENCE_FILTERS.status ||
		sort !== DEFAULT_ABSENCE_FILTERS.sort;

	const newAbsenceButton = (
		<LockableButton icon={Plus} label="Nova ausência" lock={lock} onClick={() => openForm()} />
	);

	return (
		<>
			<PageHeader
				icon={CalendarX2}
				title="Ausências e férias"
				description="Nos períodos registrados, as salas reservadas pelo profissional ficam livres."
				actions={newAbsenceButton}
			/>

			<Card className="gap-0 overflow-hidden py-0">
				<FilterBar
					label="Filtros das ausências"
					search={
						<FormField label="Buscar profissional" hint="Busque pelo nome do profissional">
							<SearchInput
								value={searchInput}
								onChange={(event) => setSearchInput(event.target.value)}
								placeholder="Ex.: Ana Souza"
								isBusy={search.isPending}
							/>
						</FormField>
					}
					onClear={clearFilters}
					canClear={canClear}
				>
					<FormField label="Situação" className="w-full sm:w-44">
						<FilterSelect
							value={status}
							onChange={setStatus}
							options={ABSENCE_STATUS_OPTIONS}
							allOptionLabel="Todas"
						/>
					</FormField>
					<FormField label="Ordenar por" className="w-full sm:w-52">
						<FilterSelect value={sort} onChange={setSort} options={ABSENCE_SORT_OPTIONS} />
					</FormField>
				</FilterBar>

				<DataTable
					caption="Ausências cadastradas"
					columns={columns}
					data={data}
					getRowId={(absence) => String(absence.id)}
					isLoading={absences.isPending}
					isError={absences.isError}
					onRetry={() => absences.refetch()}
					isRetrying={absences.isFetching}
					skeletonRows={4}
					emptyState={
						isFiltered && allCount > 0 ? (
							<EmptyState
								title="Nenhuma ausência encontrada"
								description="Nenhuma ausência corresponde aos filtros escolhidos. Ajuste os filtros ou registre uma nova ausência."
								action={<ClearFiltersButton onClick={clearFilters} />}
							/>
						) : (
							<EmptyState
								title="Nenhuma ausência cadastrada"
								description="Registre férias para que o calendário mostre a sala como livre nesse período."
								action={newAbsenceButton}
							/>
						)
					}
					header={data.length > 0 && <p>{total}</p>}
					footer={
						data.length > 0 && (
							<p className="border-t px-4 py-3 text-sm text-muted-foreground">{total}</p>
						)
					}
				/>
			</Card>

			<AbsenceFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				absence={editing}
				requesters={requesters.data ?? []}
				requestersLoading={requesters.isPending}
				requestersError={requesters.isError}
				onRetryRequesters={() => requesters.refetch()}
				isRetryingRequesters={requesters.isFetching}
			/>

			<ConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				title={`Excluir a ausência de “${deleting?.solicitanteNome ?? ""}”?`}
				description={
					deleting
						? `Período de ${formatDate(deleting.dataInicio)} a ${formatDate(deleting.dataFim)}. Essa ação será irreversível.`
						: undefined
				}
				isPending={deleteAbsence.isPending}
				error={
					deleteAbsence.isError
						? getHttpErrorMessage(deleteAbsence.error, ABSENCE_ERROR_MESSAGES.remove)
						: undefined
				}
				onConfirm={confirmDelete}
			/>
		</>
	);
}
