import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { FullCalendarModule } from "@fullcalendar/angular";
import { CalendarOptions, EventClickArg, EventInput } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import { Reservation } from "../../../core/models/reservation-response.model";
import { EventDialogModel } from "../../../core/models/event-dialog.model";
import { CalendarDialogInfosComponent } from "../calendar-dialog-infos/calendar-dialog-infos.component";
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
	private readonly eventPayloads = signal<Reservation[]>([]);

	calendarOptions = signal<CalendarOptions>({
		plugins: [dayGridPlugin],
		initialView: "dayGridMonth",
		eventClick: (info: EventClickArg) => this.openEventDetails(info),
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
		const list = this.eventPayloads();
		const match = list.find(
			(i) => String(i.reservationId) === info.event.id,
		);
		if (!match) return;

		const dialogData: EventDialogModel = {
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

		this.dialog.open(CalendarDialogInfosComponent, { data: dialogData });
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
		this.calendarStore.getReservations$();
		this.calendarStore.getReservations.subscribe((list) => {
			this.eventPayloads.set(list);
			const events: EventInput[] = list.map((c) => ({
				id: String(c.reservationId),
				title: `${c.sala} - ${this.getSectionName(c.setor)} / ${this.getHourInterval(c.horaInicio, c.horaFim)}`,
				start: this.getStrDay(c.horaInicio),
				end: this.getStrDay(c.horaFim),
				backgroundColor: this.pickColor(c),
				borderColor: this.pickColor(c),
			}));
			this.calendarOptions.update((opts) => ({
				...opts,
				events,
			}));
		});
	}

	private pickColor(c: Reservation): string {
		if (c.profissionalAusente) return "#2e7d32";
		if (c.recorrenciaId) return "#c62828";
		return "#f9a825";
	}

	getSectionName(section: string): string {
		if (section.length > 9) return `${section.slice(0, 9)}...`;
		return section;
	}
}
