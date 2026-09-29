import type { ColumnDef } from "@tanstack/react-table";
import { CalendarX2, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/DataTable";
import { RowActions } from "@/components/data-table/RowActions";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAllRequesters } from "@/features/requesters/hooks";
import { getHttpErrorMessage } from "@/lib/api/errors";
import { formatIsoDateBr } from "@/shared/format/br-format";
import { AbsenceFormDialog } from "./AbsenceFormDialog";
import { ABSENCE_ERROR_MESSAGES, useAbsences, useDeleteAbsence } from "./hooks";
import type { Absence } from "./types";

export const ABSENCE_DELETED_MESSAGE = "Ausência removida.";

const formatDate = (value: string | null | undefined) => formatIsoDateBr(value) || "—";

/** Nome acessível que distingue ausências do mesmo profissional pelo período. */
const describeAbsence = (absence: Absence) =>
	`${absence.solicitanteNome} (${formatDate(absence.dataInicio)} a ${formatDate(absence.dataFim)})`;

export function AbsencesPage() {
	const absences = useAbsences();
	const requesters = useAllRequesters();
	const deleteAbsence = useDeleteAbsence();

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
			{
				id: "actions",
				header: () => <span className="sr-only md:not-sr-only">Ações</span>,
				meta: { className: "w-28 text-right" },
				cell: ({ row }) => (
					<RowActions
						editLabel={`Editar ausência de ${describeAbsence(row.original)}`}
						deleteLabel={`Excluir ausência de ${describeAbsence(row.original)}`}
						onEdit={() => openForm(row.original)}
						onDelete={() => askDelete(row.original)}
					/>
				),
			},
		],
		[openForm, askDelete],
	);

	const data = absences.data ?? [];
	const newAbsenceButton = (
		<Button onClick={() => openForm()}>
			<Plus aria-hidden="true" />
			Nova ausência
		</Button>
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
						<EmptyState
							title="Nenhuma ausência cadastrada"
							description="Registre férias para que o calendário mostre a sala como livre nesse período."
							action={newAbsenceButton}
						/>
					}
					footer={
						data.length > 0 && (
							<p className="border-t px-4 py-3 text-sm text-muted-foreground">
								{data.length === 1 ? "1 ausência" : `${data.length} ausências`}
							</p>
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
