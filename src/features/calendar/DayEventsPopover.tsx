import { Repeat } from "lucide-react";
import { useMemo, useState } from "react";
import { SearchInput } from "@/components/filters/SearchInput";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EVENT_KIND_STYLES } from "./constants";
import {
	type CalendarEvent,
	EVENT_KIND_LABELS,
	eventDescription,
	matchesEventSearch,
	reservationTimeRange,
} from "./events";

export const DAY_EVENTS_SEARCH_LABEL = "Buscar eventos do dia";
export const DAY_EVENTS_EMPTY_MESSAGE = "Nenhum evento encontrado.";

interface DayEventsPopoverProps {
	dayLabel: string;
	dateLabel: string;
	events: CalendarEvent[];
	hiddenCount: number;
	onSelectEvent: (event: CalendarEvent) => void;
}

/** Lista completa do dia, aberta pelo "+N mais", com o horário, a sala e o setor de cada evento. */
export function DayEventsPopover({
	dayLabel,
	dateLabel,
	events,
	hiddenCount,
	onSelectEvent,
}: DayEventsPopoverProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const text = `+${hiddenCount} mais`;

	const filtered = useMemo(
		() => events.filter((event) => matchesEventSearch(event, search)),
		[events, search],
	);
	const isSearching = search.trim() !== "";
	const countLabel = isSearching
		? `${filtered.length} de ${events.length} eventos`
		: `${events.length} eventos`;

	// A busca é zerada ao abrir, e não ao fechar, para a lista não mudar durante a animação.
	const handleOpenChange = (next: boolean) => {
		if (next) setSearch("");
		setOpen(next);
	};

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<button
					type="button"
					aria-label={`${text} em ${dateLabel}`}
					className="w-full rounded px-1.5 text-left text-xs font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
				>
					{text}
				</button>
			</PopoverTrigger>
			<PopoverContent
				className="w-96 max-w-[calc(100vw-2rem)] p-0"
				align="start"
				aria-label={`Eventos de ${dayLabel}`}
			>
				<div className="flex items-baseline justify-between gap-2 border-b px-3 py-2">
					<p className="text-sm font-semibold first-letter:uppercase">{dayLabel}</p>
					<p aria-live="polite" className="shrink-0 text-xs text-muted-foreground">
						{countLabel}
					</p>
				</div>
				<div className="border-b p-2">
					<SearchInput
						aria-label={DAY_EVENTS_SEARCH_LABEL}
						placeholder="Buscar sala, setor, solicitante ou horário"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						className="h-8"
					/>
				</div>
				{filtered.length === 0 ? (
					<p className="px-3 py-6 text-center text-sm text-muted-foreground">
						{DAY_EVENTS_EMPTY_MESSAGE}
					</p>
				) : (
					<ul className="flex max-h-[min(24rem,60vh)] flex-col gap-0.5 overflow-y-auto p-1.5">
						{filtered.map((event) => (
							<li key={event.key}>
								<DayEventItem
									event={event}
									onSelect={(selected) => {
										setOpen(false);
										onSelectEvent(selected);
									}}
								/>
							</li>
						))}
					</ul>
				)}
			</PopoverContent>
		</Popover>
	);
}

interface DayEventItemProps {
	event: CalendarEvent;
	onSelect: (event: CalendarEvent) => void;
}

function DayEventItem({ event, onSelect }: DayEventItemProps) {
	const isReservation = event.type === "reservation";

	return (
		<button
			type="button"
			aria-label={eventDescription(event)}
			onClick={() => onSelect(event)}
			className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
		>
			<span
				className={cn("mt-1 size-2.5 shrink-0 rounded-full", EVENT_KIND_STYLES[event.kind].dot)}
				aria-hidden="true"
			/>
			<span className="min-w-0 flex-1">
				<span className="flex items-center gap-2">
					<span className="truncate text-sm font-medium tabular-nums">
						{isReservation
							? reservationTimeRange(event.reservation)
							: event.absence.solicitanteNome}
					</span>
					{event.kind === "recorrente" && (
						<Repeat className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
					)}
					<span className="ml-auto shrink-0 text-xs text-muted-foreground">
						{EVENT_KIND_LABELS[event.kind]}
					</span>
				</span>
				<span className="block truncate text-xs text-muted-foreground">
					{isReservation ? `${event.reservation.sala} - ${event.reservation.setor}` : "Dia inteiro"}
				</span>
			</span>
		</button>
	);
}
