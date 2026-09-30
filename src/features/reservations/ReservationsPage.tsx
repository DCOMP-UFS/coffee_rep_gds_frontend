import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { AlarmClock, CalendarX2, Plus, Repeat } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { LockableButton } from "@/components/actions/LockableButton";
import { DataTable } from "@/components/data-table/DataTable";
import { PaginationBar } from "@/components/data-table/PaginationBar";
import { PaginationSummary } from "@/components/data-table/PaginationSummary";
import { RowActionButton } from "@/components/data-table/RowActionButton";
import { actionsColumn } from "@/components/data-table/RowActions";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ClearFiltersButton } from "@/components/filters/ClearFiltersButton";
import { FilterBar } from "@/components/filters/FilterBar";
import { FilterSelect } from "@/components/filters/FilterSelect";
import { SearchInput } from "@/components/filters/SearchInput";
import { FormField } from "@/components/form/FormField";
import { MaskedInput } from "@/components/form/MaskedInput";
import { SearchableSelect } from "@/components/form/SearchableSelect";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/status/StatusBadge";
import { Card } from "@/components/ui/card";
import { ALL_SECTIONS } from "@/features/rooms/types";
import { useSections } from "@/features/sections/hooks";
import { useClampPage } from "@/hooks/use-clamp-page";
import { useDebouncedSearch } from "@/hooks/use-debounced-value";
import { useFilteredPage } from "@/hooks/use-filtered-page";
import { useValidFilterValues } from "@/hooks/use-valid-filter-values";
import { formatIsoDateTimeBr } from "@/shared/format/br-format";
import { maskDate } from "@/shared/format/masks";
import { brDateToIsoDate } from "@/shared/validators/date";
import { CancelReservationDialog } from "./CancelReservationDialog";
import {
	defaultReservationFilters,
	hasActiveReservationFilters,
	RESERVATION_SORT_OPTIONS,
	RESERVATION_TYPE_OPTIONS,
	type ReservationFilters,
	type ReservationSort,
	type ReservationTypeFilter,
	toReservationListFilters,
} from "./filters";
import { useReservations } from "./hooks";
import { cancelAccessFor, useReservationAccess } from "./permissions";
import { ReservationFormDialog } from "./ReservationFormDialog";
import {
	defaultReservationPeriod,
	type ReservationPeriodInput,
	reservationPeriodSchema,
} from "./schemas";
import type { Reservation } from "./types";

const PAGE_SIZE_OPTIONS = [5, 10] as const;
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

/** Período e filtros padrão calculados a partir do mesmo instante, para não divergirem à meia-noite. */
function initialDefaults() {
	const now = new Date();
	return { period: defaultReservationPeriod(now), filters: defaultReservationFilters(now) };
}

export function ReservationsPage() {
	const access = useReservationAccess();
	const [defaults] = useState(initialDefaults);
	const [searchInput, setSearchInput] = useState(defaults.filters.search);
	const [sectionId, setSectionId] = useState(defaults.filters.sectionId);
	const [type, setType] = useState<ReservationTypeFilter>(defaults.filters.type);
	const [sort, setSort] = useState<ReservationSort>(defaults.filters.sort);
	const [size, setSize] = useState<number>(DEFAULT_PAGE_SIZE);
	const search = useDebouncedSearch(searchInput);

	const {
		register,
		control,
		reset,
		formState: { errors, isDirty },
	} = useForm<ReservationPeriodInput>({
		resolver: zodResolver(reservationPeriodSchema),
		defaultValues: defaults.period,
		// O erro aparece ao sair do campo e, depois, a cada mudança, já que não há botão de enviar.
		mode: "onTouched",
	});
	// Enquanto o período digitado é inválido, a lista continua com o último período válido.
	const period = useValidFilterValues(control, reservationPeriodSchema);

	const sections = useSections();
	const filters: ReservationFilters = {
		search: search.applied,
		inicio: brDateToIsoDate(period.inicio),
		fim: brDateToIsoDate(period.fim),
		sectionId,
		type,
		sort,
	};
	const [page, setPage] = useFilteredPage(filters);
	const reservations = useReservations(toReservationListFilters(filters, page, size));

	// O alvo é mantido após fechar para o conteúdo não mudar durante a animação de saída.
	const [formOpen, setFormOpen] = useState(false);
	const [cancelOpen, setCancelOpen] = useState(false);
	const [cancelling, setCancelling] = useState<Reservation>();

	const pageInfo = reservations.data?.page;
	const data = reservations.data?.content ?? [];
	const hasFilters = hasActiveReservationFilters(filters, defaults.filters);
	const canClear =
		hasActiveReservationFilters({ ...filters, search: searchInput }, defaults.filters) ||
		isDirty ||
		sort !== defaults.filters.sort;

	useClampPage({ page, pageInfo, isPlaceholderData: reservations.isPlaceholderData, setPage });

	const clearFilters = () => {
		setSearchInput(defaults.filters.search);
		reset(defaults.period);
		setSectionId(defaults.filters.sectionId);
		setType(defaults.filters.type);
		setSort(defaults.filters.sort);
	};

	const sectionOptions = useMemo(
		() => [
			{ value: ALL_SECTIONS, label: "Todos" },
			...(sections.data ?? []).map((section) => ({ value: section.id, label: section.nome })),
		],
		[sections.data],
	);

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
			...actionsColumn<Reservation>(
				(reservation) => (
					<div className="flex justify-end">
						<RowActionButton
							icon={CalendarX2}
							label={`Cancelar reserva de ${reservation.sala} em ${formatIsoDateTimeBr(reservation.horaInicio)}`}
							tooltip="Cancelar"
							destructive
							lock={cancelAccessFor(reservation, access).lock}
							onClick={() => askCancel(reservation)}
						/>
					</div>
				),
				"w-20 text-right",
			),
		],
		[access, askCancel],
	);

	const newReservationButton = (
		<LockableButton
			icon={Plus}
			label="Nova reserva"
			lock={access.single.lock}
			onClick={() => setFormOpen(true)}
		/>
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
				<FilterBar
					label="Filtros das reservas"
					search={
						<FormField
							label="Buscar reserva"
							hint="Busque pela sala, pelo setor, pelo solicitante ou por quem criou a reserva"
						>
							<SearchInput
								value={searchInput}
								onChange={(event) => setSearchInput(event.target.value)}
								placeholder="Ex.: Consultório 3, Ambulatório ou Ana"
								isBusy={search.isPending || reservations.isPlaceholderData}
							/>
						</FormField>
					}
					onClear={clearFilters}
					canClear={canClear}
				>
					<FormField label="De" error={errors.inicio?.message} className="w-full sm:w-36">
						<MaskedInput
							mask={maskDate}
							placeholder="DD/MM/AAAA"
							{...register("inicio", { deps: "fim" })}
						/>
					</FormField>
					<FormField label="Até" error={errors.fim?.message} className="w-full sm:w-36">
						<MaskedInput mask={maskDate} placeholder="DD/MM/AAAA" {...register("fim")} />
					</FormField>
					<FormField label="Setor" className="w-full sm:w-56">
						<SearchableSelect
							options={sectionOptions}
							value={sectionId}
							onChange={setSectionId}
							placeholder="Selecione o setor"
							searchPlaceholder="Pesquisar setor..."
						/>
					</FormField>
					<FormField label="Tipo" className="w-full sm:w-36">
						<FilterSelect
							value={type}
							onChange={setType}
							options={RESERVATION_TYPE_OPTIONS}
							allOptionLabel="Todas"
						/>
					</FormField>
					<FormField label="Ordenar por" className="w-full sm:w-48">
						<FilterSelect value={sort} onChange={setSort} options={RESERVATION_SORT_OPTIONS} />
					</FormField>
				</FilterBar>

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
						hasFilters ? (
							<EmptyState
								title="Nenhuma reserva encontrada"
								description="Nenhuma reserva corresponde aos filtros escolhidos. Ajuste os filtros ou crie uma nova reserva."
								action={<ClearFiltersButton onClick={clearFilters} />}
							/>
						) : (
							<EmptyState
								title="Nenhuma reserva no período"
								description="Não há reservas de hoje até os próximos 30 dias. Crie uma nova reserva ou escolha outro período."
								action={newReservationButton}
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
