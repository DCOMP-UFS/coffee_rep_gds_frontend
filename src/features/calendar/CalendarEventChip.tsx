import { Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENT_KIND_STYLES } from "./constants";
import { type CalendarEvent, eventDescription, timePart } from "./events";

interface CalendarEventChipProps {
	event: CalendarEvent;
	onSelect: (event: CalendarEvent) => void;
}

/** Evento resumido numa linha; o texto completo fica no nome acessível e na dica. */
export function CalendarEventChip({ event, onSelect }: CalendarEventChipProps) {
	const description = eventDescription(event);

	return (
		<button
			type="button"
			aria-label={description}
			title={description}
			onClick={() => onSelect(event)}
			className={cn(
				"flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-xs font-medium transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
				EVENT_KIND_STYLES[event.kind].chip,
			)}
		>
			{event.type === "reservation" ? (
				<>
					<span className="shrink-0 tabular-nums">{timePart(event.reservation.horaInicio)}</span>
					<span className="truncate">{event.reservation.sala}</span>
					{event.kind === "recorrente" && (
						<Repeat className="ml-auto size-3 shrink-0" aria-hidden="true" />
					)}
				</>
			) : (
				<span className="truncate">{event.absence.solicitanteNome}: ausência</span>
			)}
		</button>
	);
}
