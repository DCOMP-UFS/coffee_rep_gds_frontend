import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { FullCalendarModule } from "@fullcalendar/angular";
import { CalendarOptions, EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
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
	events = [];
	calendarOptions = signal<CalendarOptions>({
		plugins: [dayGridPlugin],
		initialView: "dayGridMonth",
		eventClick: this.onEventClick.bind(this),
		initialEvents: this.events,
		locale: "pt-br",
		dayMaxEvents: true,
		weekends: true,
		selectMirror: true,
	});

	constructor(
		private calendarStore: CalendarComponentStore,
		private dialog: MatDialog,
	) {}

	onEventClick(info: EventClickArg) {
		this.dialog.open(CalendarDialogInfosComponent, {
			data: this.events[
				this.events.findIndex((i) => i.id.toString() === info.event.id)
			],
		});
	}

	getStrDay(date: Date): string {
		return `${date.toString().replace(/T.*$/, "")}T${date.toString().split("T")[1].slice(0, 8)}`;
	}

	getHourInterval(startTime: Date, endTime: Date): string {
		const startHourMinute = startTime.toString().split("T")[1].slice(0, 5);
		const endHourMinute = endTime.toString().split("T")[1].slice(0, 5);
		return `${startHourMinute} às ${endHourMinute}`;
	}

	ngOnInit(): void {
		this.calendarStore.getReservations$();
		this.calendarStore.getReservations.subscribe((i) => {
			i.map((c) => {
				this.events.push({
					id: c.reservationId,
					requester: c.solicitante,
					createdBy: c.criador,
					recorrenciaId: c.recorrenciaId,
					completeTitle: `${c.sala} - ${c.setor}`,
					title: `${c.sala} - ${this.getSectionName(c.setor)} / ${this.getHourInterval(c.horaInicio, c.horaFim)}`,
					start: this.getStrDay(c.horaInicio),
					end: this.getStrDay(c.horaFim),
					color: c.recorrenciaId ? "red" : "yellow",
				});
			});
		});
	}

	getSectionName(section: string): string {
		if (section.length > 9) return `${section.slice(0, 9)}...`;
		return section;
	}
}
