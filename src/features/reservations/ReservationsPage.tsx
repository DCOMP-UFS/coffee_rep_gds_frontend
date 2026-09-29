import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { AlarmClock, CalendarX2, Loader2, Plus, Repeat, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { DataTable } from "@/components/data-table/DataTable";
import { PaginationBar } from "@/components/data-table/PaginationBar";
import { PaginationSummary } from "@/components/data-table/PaginationSummary";
import { RowActionButton } from "@/components/data-table/RowActionButton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FormField } from "@/components/form/FormField";
import { MaskedInput } from "@/components/form/MaskedInput";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/status/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useClampPage } from "@/hooks/use-clamp-page";
import { formatIsoDateTimeBr } from "@/shared/format/br-format";
import { maskDate } from "@/shared/format/masks";
import { brDateToIsoDate } from "@/shared/validators/date";
import { CancelReservationDialog } from "./CancelReservationDialog";
import { useReservations } from "./hooks";
import { ReservationFormDialog } from "./ReservationFormDialog";
import {
	defaultReservationPeriod,
	type ReservationPeriodInput,
	reservationPeriodSchema,
} from "./schemas";
import type { Reservation } from "./types";

const PAGE_SIZE_OPTIONS = [5, 10] as const;
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

interface AppliedPeriod {
	inicio: string;
	fim: string;
}

const toAppliedPeriod = ({ inicio, fim }: ReservationPeriodInput): AppliedPeriod => ({
	inicio: brDateToIsoDate(inicio),
	fim: brDateToIsoDate(fim),
});

export function ReservationsPage() {
	// O período digitado só vale depois de enviado: a paginação e a recarga após cancelar usam
	// sempre o último período aplicado.
	const [initialPeriod] = useState(defaultReservationPeriod);
	const [period, setPeriod] = useState(() => toAppliedPeriod(initialPeriod));
	const [page, setPage] = useState(0);
	const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);

	const reservations = useReservations({ ...period, page, size });

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ReservationPeriodInput>({
		resolver: zodResolver(reservationPeriodSchema),
		defaultValues: initialPeriod,
	});

	// O alvo é mantido após fechar para o conteúdo não mudar durante a animação de saída.
	const [formOpen, setFormOpen] = useState(false);
	const [cancelOpen, setCancelOpen] = useState(false);
	const [cancelling, setCancelling] = useState<Reservation>();

	const pageInfo = reservations.data?.page;
	const data = reservations.data?.content ?? [];
	const isSearching = reservations.isFetching && !reservations.isPending;

	useClampPage({ page, pageInfo, isPlaceholderData: reservations.isPlaceholderData, setPage });

	const applyPeriod = handleSubmit((values) => {
		const next = toAppliedPeriod(values);
		if (next.inicio === period.inicio && next.fim === period.fim && page === 0) {
			reservations.refetch();
			return;
		}
		setPeriod(next);
		setPage(0);
	});

	const askCancel = useCallback((reservation: Reservation) => {
		setCancelling(reservation);
		setCancelOpen(true);
	}, []);

	const columns = useMemo<ColumnDef<Reservation>[]>(
		() => [
			{
				accessorKey: "sala",
				header: "Sala",
				cell: ({ row }) => <span className="font-medium">{row.original.sala}</span>,
			},
			{
				accessorKey: "setor",
				header: "Setor",
				cell: ({ row }) => <span className="text-muted-foreground">{row.original.setor}</span>,
			},
			{ accessorKey: "solicitante", header: "Solicitante" },
			{
				id: "criador",
				header: "Criado por",
				cell: ({ row }) => (
					<span className="text-muted-foreground">{row.original.criador || "—"}</span>
				),
			},
			{
				id: "horaInicio",
				header: "Início",
				meta: { className: "whitespace-nowrap" },
				cell: ({ row }) => formatIsoDateTimeBr(row.original.horaInicio),
			},
			{
				id: "horaFim",
				header: "Fim",
				meta: { className: "whitespace-nowrap" },
				cell: ({ row }) => formatIsoDateTimeBr(row.original.horaFim),
			},
			{
				id: "tipo",
				header: "Tipo",
				cell: ({ row }) =>
					row.original.recorrenciaId ? (
						<StatusBadge tone="danger" icon={Repeat}>
							Recorrente
						</StatusBadge>
					) : (
						<StatusBadge tone="warning">Pontual</StatusBadge>
					),
			},
			{
				id: "actions",
				header: () => <span className="sr-only md:not-sr-only">Ações</span>,
				meta: { className: "w-20 text-right" },
				cell: ({ row }) => (
					<div className="flex justify-end">
						<RowActionButton
							icon={CalendarX2}
							label={`Cancelar reserva de ${row.original.sala} em ${formatIsoDateTimeBr(row.original.horaInicio)}`}
							tooltip="Cancelar"
							destructive
							onClick={() => askCancel(row.original)}
						/>
					</div>
				),
			},
		],
		[askCancel],
	);

	const newReservationButton = (
		<Button onClick={() => setFormOpen(true)}>
			<Plus aria-hidden="true" />
			Nova reserva
		</Button>
	);

	return (
		<>
			<PageHeader
				icon={AlarmClock}
				title="Reservas"
				description="Reservas pontuais e recorrentes das salas no período escolhido."
				actions={newReservationButton}
			/>

			<Card className="gap-0 overflow-hidden py-0">
				<search className="border-b p-4">
					<form
						noValidate
						aria-label="Período das reservas"
						className="flex flex-col gap-3 sm:flex-row sm:items-start"
						onSubmit={applyPeriod}
					>
						<FormField label="De" error={errors.inicio?.message} className="sm:w-40">
							<MaskedInput mask={maskDate} placeholder="DD/MM/AAAA" {...register("inicio")} />
						</FormField>
						<FormField label="Até" error={errors.fim?.message} className="sm:w-40">
							<MaskedInput mask={maskDate} placeholder="DD/MM/AAAA" {...register("fim")} />
						</FormField>
						<Button type="submit" variant="outline" className="sm:mt-5" disabled={isSearching}>
							{isSearching ? (
								<Loader2 className="animate-spin" aria-hidden="true" />
							) : (
								<Search aria-hidden="true" />
							)}
							{isSearching ? "Buscando…" : "Buscar"}
						</Button>
					</form>
				</search>

				<DataTable
					caption="Reservas do período"
					columns={columns}
					data={data}
					getRowId={(reservation) => String(reservation.reservationId)}
					isLoading={reservations.isPending}
					isError={reservations.isError}
					onRetry={() => reservations.refetch()}
					isRetrying={reservations.isFetching}
					isPlaceholderData={reservations.isPlaceholderData}
					skeletonRows={size}
					emptyState={
						<EmptyState
							title="Nenhuma reserva encontrada"
							description="Ajuste o período da busca ou crie uma nova reserva."
							action={newReservationButton}
						/>
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
								disabled={reservations.isPlaceholderData}
							/>
						)
					}
				/>
			</Card>

			<ReservationFormDialog open={formOpen} onOpenChange={setFormOpen} />
			<CancelReservationDialog
				open={cancelOpen}
				onOpenChange={setCancelOpen}
				reservation={cancelling}
			/>
		</>
	);
}
