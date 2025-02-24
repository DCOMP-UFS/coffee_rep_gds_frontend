import { Injectable } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { ComponentStore } from "@ngrx/component-store";
import { EMPTY, Observable, catchError, switchMap, tap } from "rxjs";
import { Requester } from "../../../core/models/requester-response.model";
import { ReservationRequestModel } from "../../../core/models/reservation-request.model";
import { Room } from "../../../core/models/room-response.model";
import { Section } from "../../../core/models/section-response.model";
import { RequesterService } from "../../../core/services/requester.service";
import { ReservationService } from "../../../core/services/reservation.service";
import { RoomService } from "../../../core/services/room.service";
import { SectionService } from "../../../core/services/section.service";
import { ReservationDialogComponent } from "./reservation-dialog.component";

interface ReservationDialogState {
	section: Section[];
	roomsForFilter: Room[];
	requester: Requester[];
}

@Injectable()
export class ReservationDialogComponentStore extends ComponentStore<ReservationDialogState> {
	constructor(
		private roomService: RoomService,
		private sectionService: SectionService,
		private requesterService: RequesterService,
		private reservationService: ReservationService,
		public dialogRef: MatDialogRef<ReservationDialogComponent>,
	) {
		super({ section: [], roomsForFilter: [], requester: [] });
	}

	readonly getRequesterModal$ = this.effect(() =>
		this.requesterService.getRequesters().pipe(
			tap((res) => this.setRequesters(res.content)),
			catchError(() => {
				return EMPTY;
			}),
		),
	);

	readonly getSections$ = this.effect(() =>
		this.sectionService.getSections().pipe(
			tap((res) => this.setSections(res.content)),
			catchError(() => {
				return EMPTY;
			}),
		),
	);

	readonly getRoomsBySectionId$ = this.effect(
		(payload$: Observable<{ sectionId: number }>) => {
			return payload$.pipe(
				switchMap((req) =>
					this.roomService.getRoomBySectionId(req.sectionId).pipe(
						tap((res) => this.setRoomsByFilter(res.content)),
						catchError(() => EMPTY),
					),
				),
			);
		},
	);

	readonly createReservation$ = this.effect(
		(payload$: Observable<ReservationRequestModel>) => {
			return payload$.pipe(
				switchMap((req) =>
					this.reservationService.reserveRoom(req).pipe(
						tap(() => this.dialogRef.close()),
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
