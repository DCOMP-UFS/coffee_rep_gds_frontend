import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { FullCalendarModule } from "@fullcalendar/angular";
import {
	CalendarOptions,
	DatesSetArg,
	EventClickArg,
	EventInput,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import { combineLatest } from "rxjs";
import { EventDialogModel } from "../../../core/models/event-dialog.model";
import { RequesterAbsence } from "../../../core/models/requester-absence.model";
import { Reservation } from "../../../core/models/reservation-response.model";
import { CALENDAR_EVENT_COLORS } from "../../constants/calendar.constants";
import { FORM_DIALOG_CONFIG_NARROW } from "../../constants/dialog-config";
import { CalendarDialogInfosComponent } from "../calendar-dialog-infos/calendar-dialog-infos.component";
import { toExclusiveEndDate } from "./calendar-absence.util";
import { CalendarComponentStore } from "./calendar.store";

@Component({
	selector: "app-calendar",
	imports: [CommonModule, FullCalendarModule],
	providers: [CalendarComponentStore],
	standalone: true,
	templateUrl: "./calendar.component.html",
	styleUrl: "./calendar.component.scss",
})
export class CalendarComponent implements OnInit {
	readonly legendColors = CALENDAR_EVENT_COLORS;
	private readonly eventPayloads = signal<Reservation[]>([]);
	private readonly absencePayloads = signal<RequesterAbsence[]>([]);

	calendarOptions = signal<CalendarOptions>({
		plugins: [dayGridPlugin],
		initialView: "dayGridMonth",
		headerToolbar: {
			left: "prev,next today",
			center: "title",
			right: "",
		},
		buttonText: {
			today: "Hoje",
		},
		eventClick: (info: EventClickArg) => this.openEventDetails(info),
		datesSet: (info: DatesSetArg) => this.onVisibleRangeChange(info),
		events: [],
		locale: "pt-br",
		dayMaxEvents: true,
		weekends: true,
		height: "auto",
	});

	constructor(
		private calendarStore: CalendarComponentStore,
		private dialog: MatDialog,
	) {}

	openEventDetails(info: EventClickArg) {
		const eventId = String(info.event.id);
		if (eventId.startsWith("absence-")) {
			this.openAbsenceDetails(Number(eventId.replace("absence-", "")));
			return;
		}

		const list = this.eventPayloads();
		const match = list.find((i) => String(i.reservationId) === eventId);
		if (!match) return;

		const dialogData: EventDialogModel = {
			kind: "reservation",
			id: match.reservationId,
			requester: match.solicitante,
			createdBy: match.criador,
			recorrenciaId: match.recorrenciaId,
			completeTitle: `${match.sala} - ${match.setor}`,
			title: `${match.sala} - ${match.setor}`,
			start: new Date(match.horaInicio),
			end: new Date(match.horaFim),
			profissionalAusente: match.profissionalAusente,
		};

		this.dialog.open(CalendarDialogInfosComponent, {
			...FORM_DIALOG_CONFIG_NARROW,
			data: dialogData,
		});
	}

	getStrDay(date: Date): string {
		const d = new Date(date);
		const isoDate = d.toISOString().split("T")[0];
		const time = d.toTimeString().slice(0, 8);
		return `${isoDate}T${time}`;
	}

	getHourInterval(startTime: Date, endTime: Date): string {
		const s = new Date(startTime);
		const e = new Date(endTime);
		const sh = s.toTimeString().slice(0, 5);
		const eh = e.toTimeString().slice(0, 5);
		return `${sh} às ${eh}`;
	}

	ngOnInit(): void {
		combineLatest([
			this.calendarStore.getReservations,
			this.calendarStore.getAbsences,
		]).subscribe(([reservations, absences]) => {
			this.eventPayloads.set(reservations);
			this.absencePayloads.set(absences);
			this.calendarOptions.update((opts) => ({
				...opts,
				events: [
					...this.mapReservationEvents(reservations),
					...this.mapAbsenceEvents(absences),
				],
			}));
		});
	}

	private onVisibleRangeChange(info: DatesSetArg): void {
		this.calendarStore.getReservationsForRange$({
			start: info.start,
			end: info.end,
		});
	}

	private mapReservationEvents(reservations: Reservation[]): EventInput[] {
		return reservations.map((reservation) => ({
			id: String(reservation.reservationId),
			title: `${reservation.sala} - ${this.getSectionName(reservation.setor)} / ${this.getHourInterval(reservation.horaInicio, reservation.horaFim)}`,
			start: this.getStrDay(reservation.horaInicio),
			end: this.getStrDay(reservation.horaFim),
			backgroundColor: this.pickReservationColor(reservation),
			borderColor: this.pickReservationColor(reservation),
		}));
	}

	private mapAbsenceEvents(absences: RequesterAbsence[]): EventInput[] {
		return absences.map((absence) => ({
			id: `absence-${absence.id}`,
			title: `${absence.solicitanteNome} — ausência/férias`,
			start: absence.dataInicio,
			end: toExclusiveEndDate(absence.dataFim),
			allDay: true,
			backgroundColor: CALENDAR_EVENT_COLORS.ausencia,
			borderColor: CALENDAR_EVENT_COLORS.ausencia,
		}));
	}

	private openAbsenceDetails(absenceId: number): void {
		const absence = this.absencePayloads().find(
			(item) => item.id === absenceId,
		);
		if (!absence) return;

		const dialogData: EventDialogModel = {
			kind: "absence",
			id: absence.id,
			requester: absence.solicitanteNome,
			createdBy: "",
			completeTitle: "Ausência / férias",
			title: absence.solicitanteNome,
			start: new Date(`${absence.dataInicio}T00:00:00`),
			end: new Date(`${absence.dataFim}T23:59:59`),
			profissionalAusente: true,
		};

		this.dialog.open(CalendarDialogInfosComponent, {
			...FORM_DIALOG_CONFIG_NARROW,
			data: dialogData,
		});
	}

	private pickReservationColor(reservation: Reservation): string {
		if (reservation.profissionalAusente) return CALENDAR_EVENT_COLORS.ausencia;
		if (reservation.recorrenciaId) return CALENDAR_EVENT_COLORS.recorrente;
		return CALENDAR_EVENT_COLORS.pontual;
	}

	getSectionName(section: string): string {
		if (section.length > 9) return `${section.slice(0, 9)}...`;
		return section;
	}
}
