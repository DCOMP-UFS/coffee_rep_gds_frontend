import { Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";
import { EMPTY, Observable, catchError, switchMap, tap } from "rxjs";
import { Requester } from "../../core/models/requester-response.model";
import { ReservationRequestModel } from "../../core/models/reservation-request.model";
import { Room } from "../../core/models/room-response.model";
import { Section } from "../../core/models/section-response.model";
import { RequesterService } from "../../core/services/requester.service";
import { ReservationService } from "../../core/services/reservation.service";
import { RoomService } from "../../core/services/room.service";
import { SectionService } from "../../core/services/section.service";

interface CurrentMonthState {
	section: Section[];
	roomsForFilter: Room[];
	requester: Requester[];
}

@Injectable()
export class CurrentMonthComponentStore extends ComponentStore<CurrentMonthState> {
	constructor(
		private roomService: RoomService,
		private sectionService: SectionService,
		private requesterService: RequesterService,
		private reservationService: ReservationService,
	) {
		super({ section: [], roomsForFilter: [], requester: [] });
	}

	readonly getRequester$ = this.effect(() =>
		this.requesterService.getRequesterUnpaged().pipe(
			tap((res) => this.setRequesters(res)),
			catchError(() => {
				return EMPTY;
			}),
		),
	);

	readonly getRoomsBySectionId$ = this.effect(
		(payload$: Observable<{ sectionId: number }>) => {
			return payload$.pipe(
				switchMap((req) =>
					this.roomService.getRoomBySectionId(req.sectionId, "Livre").pipe(
						tap((res) => this.setRoomsByFilter(res)),
						catchError(() => EMPTY),
					),
				),
			);
		},
	);

	readonly getSections$ = this.effect(() =>
		this.sectionService.getSections().pipe(
			tap((res) => this.setSections(res.content)),
			catchError(() => {
				return EMPTY;
			}),
		),
	);

	readonly createReservation$ = this.effect(
		(payload$: Observable<ReservationRequestModel>) => {
			return payload$.pipe(
				switchMap((req) =>
					this.reservationService.reserveRoom(req).pipe(
						tap(() => location.reload()),
						catchError(() => EMPTY),
					),
				),
			);
		},
	);

	readonly getRoomsByFilter = this.select((state) => state.roomsForFilter);
	readonly getSections = this.select((state) => state.section);
	readonly getRequesters = this.select((state) => state.requester);

	readonly setRequesters = this.updater((state, requesters: Requester[]) => ({
		...state,
		requester: requesters,
	}));

	readonly setSections = this.updater((state, sections: Section[]) => ({
		...state,
		section: sections,
	}));

	readonly setRoomsByFilter = this.updater((state, rooms: Room[]) => ({
		...state,
		roomsForFilter: rooms,
	}));
}
