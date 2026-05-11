import { TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { BehaviorSubject } from "rxjs";
import { Reservation } from "../../../core/models/reservation-response.model";
import { CalendarComponent } from "./calendar.component";
import { CalendarComponentStore } from "./calendar.store";

describe("CalendarComponent", () => {
	let reservations$: BehaviorSubject<Reservation[]>;

	beforeEach(async () => {
		reservations$ = new BehaviorSubject<Reservation[]>([]);
		const store = {
			getReservations$: jasmine.createSpy("getReservations$"),
			getReservations: reservations$.asObservable(),
		};

		await TestBed.configureTestingModule({
			imports: [CalendarComponent],
			providers: [
				{ provide: MatDialog, useValue: jasmine.createSpyObj("MatDialog", ["open"]) },
			],
		})
			.overrideComponent(CalendarComponent, {
				set: {
					providers: [{ provide: CalendarComponentStore, useValue: store }],
				},
			})
			.compileComponents();
	});

	it("maps reservation colors for absence, recurrence and punctual", () => {
		const fixture = TestBed.createComponent(CalendarComponent);
		const component = fixture.componentInstance;
		fixture.detectChanges();

		const base: Reservation = {
			reservationId: 1,
			horaInicio: new Date("2026-05-10T08:00:00"),
			horaFim: new Date("2026-05-10T09:00:00"),
			sala: "Sala",
			setor: "Setor",
			solicitante: "Dr.",
			criador: "Admin",
			salaId: 1,
			solicitanteId: 1,
		};

		reservations$.next([
			{ ...base, reservationId: 1, profissionalAusente: true },
			{ ...base, reservationId: 2, recorrenciaId: 10 },
			{ ...base, reservationId: 3 },
		]);

		const events = component.calendarOptions().events as Array<{
			backgroundColor: string;
		}>;
		expect(events[0].backgroundColor).toBe("#2e7d32");
		expect(events[1].backgroundColor).toBe("#c62828");
		expect(events[2].backgroundColor).toBe("#f9a825");
	});
});
