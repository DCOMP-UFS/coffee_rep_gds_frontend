import { eachDayOfInterval, parseISO } from "date-fns";
import type { Absence } from "@/features/absences/types";
import type { Reservation } from "@/features/reservations/types";
import { matchesSearch } from "@/shared/format/search";
import { toIsoDate } from "./month-grid";

/** Tipo visual do evento, que define a cor e o selo. */
export type CalendarEventKind = "pontual" | "recorrente" | "livre";

export const EVENT_KIND_LABELS: Record<CalendarEventKind, string> = {
	pontual: "Pontual",
	recorrente: "Recorrente",
	livre: "Livre (férias / ausência)",
};

export type CalendarEvent =
	| { type: "reservation"; key: string; kind: CalendarEventKind; reservation: Reservation }
	| { type: "absence"; key: string; kind: "livre"; absence: Absence };

/** Mesma regra do Angular: profissional ausente libera a sala, e isso vale mais que a série. */
export function reservationKind(reservation: Reservation): CalendarEventKind {
	if (reservation.profissionalAusente) return "livre";
	if (reservation.recorrenciaId) return "recorrente";
	return "pontual";
}

/**
 * `2026-09-29T22:00:00` → `2026-09-29`. O backend manda o horário local sem fuso, então a data
 * é lida do texto: passar por `Date` e `toISOString` jogava as reservas da noite para o dia
 * seguinte.
 */
export function datePart(value: string): string | null {
	return /^(\d{4}-\d{2}-\d{2})/.exec(value.trim())?.[1] ?? null;
}

/** `2026-09-29T22:00:00` → `22:00`. */
export function timePart(value: string): string {
	return /[T ](\d{2}:\d{2})/.exec(value)?.[1] ?? "";
}

/** "08:00 às 09:30". */
export const reservationTimeRange = (reservation: Reservation) =>
	`${timePart(reservation.horaInicio)} às ${timePart(reservation.horaFim)}`;

/** Texto completo do evento, usado como nome acessível e dica ao passar o mouse. */
export function eventDescription(event: CalendarEvent): string {
	if (event.type === "absence") return `${event.absence.solicitanteNome}: ausência/férias`;
	const { reservation } = event;
	return `${reservationTimeRange(reservation)}, ${reservation.sala} - ${reservation.setor}, ${EVENT_KIND_LABELS[event.kind]}`;
}

/**
 * Se o evento corresponde à busca, ignorando acentos e maiúsculas. Reservas são encontradas pelo
 * horário, sala, setor, solicitante, quem criou ou tipo; ausências, pelo profissional ou tipo.
 * A sala e o setor também são comparados juntos, como aparecem na lista ("Sala 17 - Clínica").
 */
export function matchesEventSearch(event: CalendarEvent, term: string): boolean {
	const kindLabel = EVENT_KIND_LABELS[event.kind];
	if (event.type === "absence") {
		return matchesSearch(term, event.absence.solicitanteNome, kindLabel);
	}
	const { reservation } = event;
	return matchesSearch(
		term,
		reservationTimeRange(reservation),
		`${reservation.sala} - ${reservation.setor}`,
		reservation.solicitante,
		reservation.criador,
		kindLabel,
	);
}

/** Dias da ausência que caem no período visível, em datas ISO. */
function absenceDaysInRange(absence: Absence, inicio: string, fim: string): string[] {
	const absenceStart = datePart(absence.dataInicio ?? "");
	const absenceEnd = datePart(absence.dataFim ?? "");
	if (!absenceStart || !absenceEnd) return [];
	const start = absenceStart > inicio ? absenceStart : inicio;
	const end = absenceEnd < fim ? absenceEnd : fim;
	if (start > end) return [];
	return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).map(toIsoDate);
}

function compareEvents(a: CalendarEvent, b: CalendarEvent): number {
	if (a.type !== b.type) return a.type === "absence" ? -1 : 1;
	if (a.type === "absence" && b.type === "absence") {
		return a.absence.solicitanteNome.localeCompare(b.absence.solicitanteNome, "pt-BR");
	}
	if (a.type === "reservation" && b.type === "reservation") {
		return (
			a.reservation.horaInicio.localeCompare(b.reservation.horaInicio) ||
			a.reservation.sala.localeCompare(b.reservation.sala, "pt-BR", { numeric: true })
		);
	}
	return 0;
}

/**
 * Eventos de cada dia do período (datas ISO, inclusive nas duas pontas): ausências primeiro,
 * que valem o dia inteiro, e depois as reservas pelo horário de início.
 */
export function groupEventsByDay(
	reservations: readonly Reservation[],
	absences: readonly Absence[],
	{ inicio, fim }: { inicio: string; fim: string },
): Map<string, CalendarEvent[]> {
	const byDay = new Map<string, CalendarEvent[]>();
	const add = (day: string, event: CalendarEvent) => {
		const list = byDay.get(day);
		if (list) list.push(event);
		else byDay.set(day, [event]);
	};

	for (const absence of absences) {
		for (const day of absenceDaysInRange(absence, inicio, fim)) {
			add(day, { type: "absence", key: `absence-${absence.id}-${day}`, kind: "livre", absence });
		}
	}

	for (const reservation of reservations) {
		const day = datePart(reservation.horaInicio);
		if (!day || day < inicio || day > fim) continue;
		add(day, {
			type: "reservation",
			key: `reservation-${reservation.reservationId}`,
			kind: reservationKind(reservation),
			reservation,
		});
	}

	for (const list of byDay.values()) list.sort(compareEvents);
	return byDay;
}
