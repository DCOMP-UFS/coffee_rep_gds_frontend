import { Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";
import { EMPTY, Observable, catchError, switchMap, tap } from "rxjs";
import { ReservationRequestParamsModel } from "../../core/models/reservation-request-params.model";
import { ReservationResponseModel } from "../../core/models/reservation-response.model";
import { ReservationService } from "../../core/services/reservation.service";

interface ReservationState {
	reservation: ReservationResponseModel;
}

@Injectable()
export class ReservationsComponentStore extends ComponentStore<ReservationState> {
	constructor(private reservationService: ReservationService) {
		super({ reservation: {} as ReservationResponseModel });
	}

	readonly getReservations$ = this.effect(
		(payload$: Observable<ReservationRequestParamsModel>) => {
			return payload$.pipe(
				switchMap((req) =>
					this.reservationService.getReservation(req).pipe(
						tap((res) => this.setReservations(res)),
						catchError(() => {
							return EMPTY;
						}),
					),
				),
			);
		},
	);

	readonly getReservations = this.select((state) => state.reservation);

	readonly setReservations = this.updater(
		(state, res: ReservationResponseModel) => ({
			...state,
			reservation: res,
		}),
	);
}
