import { Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";
import { EMPTY, catchError, tap } from "rxjs";
import { Reservation } from "../../../core/models/reservation-response.model";
import { ReservationService } from "../../../core/services/reservation.service";

interface CalendarState {
	reservation: Reservation[];
}

@Injectable()
export class CalendarComponentStore extends ComponentStore<CalendarState> {
	constructor(private reservationService: ReservationService) {
		super({ reservation: [] });
	}

	readonly getReservations$ = this.effect(() =>
    this.reservationService.getReservationCurrentMonth().pipe(
      tap((res) => this.setReservations(res)),
      catchError(() => {
        return EMPTY;
      }),
    ),
	);

	readonly getReservations = this.select((state) => state.reservation);

	readonly setReservations = this.updater((state, res: Reservation[]) => ({
		...state,
		reservation: res,
	}));
}
