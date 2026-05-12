import { Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";
import { EMPTY, Observable, catchError, forkJoin, switchMap, tap } from "rxjs";
import { RequesterAbsence } from "../../../core/models/requester-absence.model";
import { Reservation } from "../../../core/models/reservation-response.model";
import { RequesterAbsenceHttpService } from "../../../core/services/requester-absence-http.service";
import { ReservationService } from "../../../core/services/reservation.service";
import { filterAbsencesInVisibleRange } from "./calendar-absence.util";

export interface CalendarVisibleRange {
	start: Date;
	end: Date;
}

interface CalendarState {
	reservation: Reservation[];
	absences: RequesterAbsence[];
}

@Injectable()
export class CalendarComponentStore extends ComponentStore<CalendarState> {
	constructor(
		private reservationService: ReservationService,
		private absenceService: RequesterAbsenceHttpService,
	) {
		super({ reservation: [], absences: [] });
	}

	readonly getReservationsForRange$ = this.effect(
		(range$: Observable<CalendarVisibleRange>) => {
			return range$.pipe(
				switchMap((range) =>
					forkJoin({
						reservations: this.reservationService.getReservationsByRange(
							range.start,
							range.end,
						),
						absences: this.absenceService.listForCalendar(),
					}).pipe(
						tap(({ reservations, absences }) => {
							this.patchState({
								reservation: reservations,
								absences: filterAbsencesInVisibleRange(
									absences,
									range.start,
									range.end,
								),
							});
						}),
						catchError(() => EMPTY),
					),
				),
			);
		},
	);

	readonly getReservations = this.select((state) => state.reservation);
	readonly getAbsences = this.select((state) => state.absences);

	readonly setReservations = this.updater((state, res: Reservation[]) => ({
		...state,
		reservation: res,
	}));
}
