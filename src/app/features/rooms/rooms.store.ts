import { Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";
import { EMPTY, Observable, catchError, switchMap, tap } from "rxjs";
import { RoomRequestParamsModel } from "../../core/models/room-request-params.model";
import { RoomResponseModel } from "../../core/models/room-response.model";
import { Section } from "../../core/models/section-response.model";
import { RoomService } from "../../core/services/room.service";
import { SectionService } from "../../core/services/section.service";

interface RoomsState {
	rooms: RoomResponseModel;
	section: Section[];
}
@Injectable()
export class RoomsComponentStore extends ComponentStore<RoomsState> {
	constructor(
		private roomService: RoomService,
		private sectionService: SectionService,
	) {
		super({ rooms: {} as RoomResponseModel, section: [] });
	}

	readonly getRooms$ = this.effect(
		(payload$: Observable<RoomRequestParamsModel>) => {
			return payload$.pipe(
				switchMap((req) => {
					return this.roomService.getRooms(req).pipe(
						tap((res) => this.setRooms(res)),
						catchError(() => {
							return EMPTY;
						}),
					);
				}),
			);
		},
	);

	readonly deleteRoom$ = this.effect(
		(payload$: Observable<{ roomId: number }>) => {
			return payload$.pipe(
				switchMap((req) => {
					return this.roomService.deleteRoom(req.roomId).pipe(
						tap(() => window.location.reload()),
						catchError(() => {
							return EMPTY;
						}),
					);
				}),
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

	readonly getRooms = this.select((state) => state.rooms);
	readonly getSections = this.select((state) => state.section);

	readonly setRooms = this.updater((state, res: RoomResponseModel) => ({
		...state,
		rooms: res,
	}));

	readonly setSections = this.updater((state, sections: Section[]) => ({
		...state,
		section: sections,
	}));
}
