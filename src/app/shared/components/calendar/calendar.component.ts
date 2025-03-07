import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FullCalendarModule } from "@fullcalendar/angular";
import { CalendarOptions } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
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
		initialEvents: this.events,
		locale: "pt-br",
		dayMaxEvents: true,
		weekends: true,
		selectMirror: true,
	});

	constructor(private calendarStore: CalendarComponentStore) {}

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
			i.map((c, index) => {
				this.events.push({
					id: index,
					title: `${c.sala} - ${c.setor} / ${this.getHourInterval(c.horaInicio, c.horaFim)}`,
					start: this.getStrDay(c.horaInicio),
					end: this.getStrDay(c.horaFim),
				});
			});
		});
	}
}
