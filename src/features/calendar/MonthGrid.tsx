import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CalendarEventChip } from "./CalendarEventChip";
import { MAX_EVENTS_PER_DAY } from "./constants";
import { DayEventsPopover } from "./DayEventsPopover";
import type { CalendarEvent } from "./events";
import { type CalendarDay, longDayLabel, WEEKDAY_SHORT_LABELS } from "./month-grid";

const NO_EVENTS: CalendarEvent[] = [];

const brDate = (date: Date) => format(date, "dd/MM/yyyy");

const dayNumberClasses = (day: CalendarDay) =>
	cn(
		"flex size-7 items-center justify-center rounded-full text-sm tabular-nums",
		!day.inMonth && "text-muted-foreground",
		day.isToday && "bg-primary font-semibold text-primary-foreground",
	);

interface MonthGridProps {
	label: string;
	weeks: CalendarDay[][];
	eventsByDay: Map<string, CalendarEvent[]>;
	/** Primeira carga: os dias aparecem com esqueletos no lugar dos eventos. */
	isLoading: boolean;
	/** Nova consulta a caminho: a grade atual fica esmaecida até ela chegar. */
	isUpdating: boolean;
	/** Ausente quando o perfil não pode reservar: o número do dia deixa de ser um botão. */
	onNewReservation?: (day: Date) => void;
	onSelectEvent: (event: CalendarEvent) => void;
}

export function MonthGrid({
	label,
	weeks,
	eventsByDay,
	isLoading,
	isUpdating,
	onNewReservation,
	onSelectEvent,
}: MonthGridProps) {
	return (
		<div className="overflow-x-auto">
			<section
				aria-label={label}
				aria-busy={isLoading || isUpdating}
				className={cn("min-w-224 transition-opacity", isUpdating && "opacity-60")}
			>
				<div className="grid grid-cols-7 border-b bg-muted/60" aria-hidden="true">
					{WEEKDAY_SHORT_LABELS.map((weekday) => (
						<div
							key={weekday}
							className="px-2 py-2 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase"
						>
							{weekday}
						</div>
					))}
				</div>
				<div className="grid grid-cols-7 [&>*:nth-child(7n)]:border-r-0">
					{weeks.flat().map((day) => (
						<DayCell
							key={day.iso}
							day={day}
							events={eventsByDay.get(day.iso) ?? NO_EVENTS}
							isLoading={isLoading}
							onNewReservation={onNewReservation}
							onSelectEvent={onSelectEvent}
						/>
					))}
				</div>
			</section>
		</div>
	);
}

interface DayCellProps {
	day: CalendarDay;
	events: CalendarEvent[];
	isLoading: boolean;
	onNewReservation?: (day: Date) => void;
	onSelectEvent: (event: CalendarEvent) => void;
}

function DayCell({ day, events, isLoading, onNewReservation, onSelectEvent }: DayCellProps) {
	const label = longDayLabel(day.date);
	// Com eventos demais, a última linha vira o "+N mais", mantendo a altura dos dias.
	const overflows = events.length > MAX_EVENTS_PER_DAY;
	const visible = overflows ? events.slice(0, MAX_EVENTS_PER_DAY - 1) : events;
	const hiddenCount = events.length - visible.length;

	return (
		<fieldset
			aria-label={label}
			className={cn("flex min-h-28 min-w-0 flex-col gap-1 border-r border-b p-1.5", {
				"bg-muted/40": !day.inMonth,
			})}
		>
			<div className="flex justify-end">
				{onNewReservation ? (
					<button
						type="button"
						aria-label={`Nova reserva em ${brDate(day.date)}`}
						aria-current={day.isToday ? "date" : undefined}
						title="Nova reserva neste dia"
						onClick={() => onNewReservation(day.date)}
						className={cn(
							dayNumberClasses(day),
							"transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring",
							day.isToday && "hover:bg-primary/90",
						)}
					>
						{day.date.getDate()}
					</button>
				) : (
					<span aria-current={day.isToday ? "date" : undefined} className={dayNumberClasses(day)}>
						{day.date.getDate()}
					</span>
				)}
			</div>
			{isLoading ? (
				<Skeleton className="h-4 w-full" />
			) : (
				events.length > 0 && (
					<ul className="flex min-w-0 flex-col gap-1">
						{visible.map((event) => (
							<li key={event.key}>
								<CalendarEventChip event={event} onSelect={onSelectEvent} />
							</li>
						))}
						{hiddenCount > 0 && (
							<li>
								<DayEventsPopover
									dayLabel={label}
									dateLabel={brDate(day.date)}
									events={events}
									hiddenCount={hiddenCount}
									onSelectEvent={onSelectEvent}
								/>
							</li>
						)}
					</ul>
				)
			)}
		</fieldset>
	);
}
