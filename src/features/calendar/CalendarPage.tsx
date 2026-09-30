import { addMonths, format, isSameMonth, parseISO, startOfMonth } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { LockableButton } from "@/components/actions/LockableButton";
import { LoadErrorAlert } from "@/components/feedback/LoadErrorAlert";
import { FormField } from "@/components/form/FormField";
import { SearchableSelect } from "@/components/form/SearchableSelect";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAbsences } from "@/features/absences/hooks";
import { useCalendarReservations } from "@/features/reservations/hooks";
import { ReservationFormDialog } from "@/features/reservations/ReservationFormDialog";
import { useSections } from "@/features/sections/hooks";
import { useAccess } from "@/features/session/access-dialog/useAccess";
import { cn } from "@/lib/utils";
import { EVENT_KIND_STYLES } from "./constants";
import { EventDetailsDialog } from "./EventDetailsDialog";
import {
	type CalendarEvent,
	type CalendarEventKind,
	EVENT_KIND_LABELS,
	groupEventsByDay,
} from "./events";
import { MonthGrid } from "./MonthGrid";
import { MonthYearPicker } from "./MonthYearPicker";
import { buildMonthWeeks, monthTitle, toIsoDate, visibleRange } from "./month-grid";

export const CALENDAR_LOAD_ERRORS = {
	reservations: "Não foi possível carregar as reservas deste período.",
	absences: "Não foi possível carregar as ausências.",
} as const;

/** Valor do "Todos os setores" no filtro; nenhum setor real tem id 0. */
const ALL_SECTIONS = 0;

const LEGEND: CalendarEventKind[] = ["pontual", "recorrente", "livre"];

export function CalendarPage() {
	const { allowed: canReserve, lock: reserveLock } = useAccess(
		"reservation.single.manage",
		"Criar reservas pelo calendário",
	);
	const [month, setMonth] = useState(() => startOfMonth(new Date()));
	const [sectionId, setSectionId] = useState(ALL_SECTIONS);

	const range = useMemo(() => visibleRange(month), [month]);
	const reservations = useCalendarReservations({
		...range,
		...(sectionId !== ALL_SECTIONS && { setorId: sectionId }),
	});
	const absences = useAbsences({ inlineError: true });
	const sections = useSections();

	// A grade só é refeita quando o mês ou o dia de hoje mudam.
	const todayIso = toIsoDate(new Date());
	const weeks = useMemo(() => buildMonthWeeks(month, parseISO(todayIso)), [month, todayIso]);
	const eventsByDay = useMemo(
		() => groupEventsByDay(reservations.data ?? [], absences.data ?? [], range),
		[reservations.data, absences.data, range],
	);

	const sectionOptions = useMemo(
		() => [
			{ value: ALL_SECTIONS, label: "Todos os setores" },
			...(sections.data ?? []).map((section) => ({ value: section.id, label: section.nome })),
		],
		[sections.data],
	);

	const isLoading = reservations.isPending || absences.isPending;
	const isUpdating = !isLoading && (reservations.isFetching || absences.isFetching);
	const isCurrentMonth = isSameMonth(month, new Date());
	const title = monthTitle(month);

	// Os alvos dos diálogos ficam guardados após fechar, para o conteúdo não mudar na animação.
	const [formOpen, setFormOpen] = useState(false);
	const [formDate, setFormDate] = useState<string>();
	const [detailsOpen, setDetailsOpen] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState<CalendarEvent>();

	const openNewReservation = (day: Date) => {
		setFormDate(format(day, "dd/MM/yyyy"));
		setFormOpen(true);
	};

	const openDetails = (event: CalendarEvent) => {
		setSelectedEvent(event);
		setDetailsOpen(true);
	};

	return (
		<>
			<PageHeader
				icon={CalendarDays}
				title="Calendário"
				description={
					canReserve
						? "Reservas e ausências do mês. Clique no número de um dia para reservar nele."
						: "Reservas e ausências do mês."
				}
				actions={
					<LockableButton
						icon={Plus}
						label="Nova reserva"
						lock={reserveLock}
						onClick={() => openNewReservation(new Date())}
					/>
				}
			/>

			<Card className="gap-0 overflow-hidden py-0">
				<div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-end lg:justify-between">
					<FormField label="Setor" className="lg:w-72">
						<SearchableSelect
							options={sectionOptions}
							value={sectionId}
							onChange={setSectionId}
							placeholder={sections.isPending ? "Carregando setores..." : "Selecione o setor"}
							searchPlaceholder="Pesquisar setor..."
							emptyMessage="Nenhum setor encontrado."
						/>
					</FormField>

					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="outline"
							size="icon"
							aria-label="Mês anterior"
							onClick={() => setMonth((current) => addMonths(current, -1))}
						>
							<ChevronLeft aria-hidden="true" />
						</Button>
						<Button
							variant="outline"
							disabled={isCurrentMonth}
							onClick={() => setMonth(startOfMonth(new Date()))}
						>
							Hoje
						</Button>
						<Button
							variant="outline"
							size="icon"
							aria-label="Próximo mês"
							onClick={() => setMonth((current) => addMonths(current, 1))}
						>
							<ChevronRight aria-hidden="true" />
						</Button>
						<MonthYearPicker month={month} onChange={setMonth} />
						<h2 className="ml-2 min-w-44 text-lg font-semibold first-letter:uppercase">{title}</h2>
						<p
							role="status"
							aria-live="polite"
							className="flex items-center gap-1.5 text-sm text-muted-foreground"
						>
							{(isLoading || isUpdating) && (
								<>
									<Loader2 className="size-4 animate-spin" aria-hidden="true" />
									Carregando…
								</>
							)}
						</p>
					</div>
				</div>

				{(reservations.isError || absences.isError) && (
					<div className="grid gap-2 border-b p-4">
						{reservations.isError && (
							<LoadErrorAlert
								message={CALENDAR_LOAD_ERRORS.reservations}
								onRetry={() => reservations.refetch()}
								isRetrying={reservations.isFetching}
							/>
						)}
						{absences.isError && (
							<LoadErrorAlert
								message={CALENDAR_LOAD_ERRORS.absences}
								onRetry={() => absences.refetch()}
								isRetrying={absences.isFetching}
							/>
						)}
					</div>
				)}

				<ul
					aria-label="Legenda"
					className="flex flex-wrap gap-x-5 gap-y-2 border-b px-4 py-3 text-sm"
				>
					{LEGEND.map((kind) => (
						<li key={kind} className="flex items-center gap-2">
							<span
								className={cn("size-3 rounded-full", EVENT_KIND_STYLES[kind].dot)}
								aria-hidden="true"
							/>
							{EVENT_KIND_LABELS[kind]}
						</li>
					))}
				</ul>

				<MonthGrid
					label={`Calendário de ${title}`}
					weeks={weeks}
					eventsByDay={eventsByDay}
					isLoading={isLoading}
					isUpdating={isUpdating}
					onNewReservation={canReserve ? openNewReservation : undefined}
					onSelectEvent={openDetails}
				/>
			</Card>

			<ReservationFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				initialDate={formDate}
				initialSectionId={sectionId === ALL_SECTIONS ? null : sectionId}
			/>
			<EventDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} event={selectedEvent} />
		</>
	);
}
