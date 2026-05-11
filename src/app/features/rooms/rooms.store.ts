import { Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";
import {
	EMPTY,
	Observable,
	catchError,
	finalize,
	of,
	switchMap,
	tap,
} from "rxjs";
import { RoomRequestParamsModel } from "../../core/models/room-request-params.model";
import { RoomResponseModel } from "../../core/models/room-response.model";
import { Section } from "../../core/models/section-response.model";
import { RoomService } from "../../core/services/room.service";
import { SectionService } from "../../core/services/section.service";
import { SnackBarService } from "../../core/services/snack-bar.service";

interface RoomsState {
	rooms: RoomResponseModel;
	section: Section[];
	lastRoomParams: RoomRequestParamsModel | null;
	roomsLoading: boolean;
	roomsError: string | null;
	sectionsLoading: boolean;
	sectionsError: string | null;
}

const emptyRooms = (): RoomResponseModel => ({
	content: [],
	page: {
		totalElements: 0,
		totalPages: 0,
		size: 5,
		number: 0,
	},
});

@Injectable()
export class RoomsComponentStore extends ComponentStore<RoomsState> {
	constructor(
		private roomService: RoomService,
		private sectionService: SectionService,
		private snackBar: SnackBarService,
	) {
		super({
			rooms: emptyRooms(),
			section: [],
			lastRoomParams: null,
			roomsLoading: false,
			roomsError: null,
			sectionsLoading: false,
			sectionsError: null,
		});
	}

	readonly getRooms$ = this.effect(
		(payload$: Observable<RoomRequestParamsModel>) => {
			return payload$.pipe(
				tap(() =>
					this.patchState({
						roomsLoading: true,
						roomsError: null,
					}),
				),
				switchMap((req) => {
					this.patchState({ lastRoomParams: req });
					return this.roomService.getRooms(req).pipe(
						tap((res) => this.setRooms(res)),
						catchError(() => {
							this.patchState({
								roomsError:
									"Não foi possível carregar as salas. Verifique a conexão e tente novamente.",
							});
							return EMPTY;
						}),
						finalize(() => this.patchState({ roomsLoading: false })),
					);
				}),
			);
		},
	);

	readonly deleteRoom$ = this.effect(
		(payload$: Observable<{ roomId: number }>) => {
			return payload$.pipe(
				switchMap((req) => {
					const last = this.get().lastRoomParams;
					return this.roomService.deleteRoom(req.roomId).pipe(
						tap(() => {
							this.snackBar.openSnackBar("Sala excluída com sucesso.");
							if (last) {
								this.getRooms$(last);
							}
						}),
						catchError(() => {
							this.snackBar.openSnackBar(
								"Não foi possível excluir a sala. Tente novamente.",
							);
							return EMPTY;
						}),
					);
				}),
			);
		},
	);

	readonly getSections$ = this.effect(() =>
		of(null).pipe(
			tap(() =>
				this.patchState({ sectionsLoading: true, sectionsError: null }),
			),
			switchMap(() =>
				this.sectionService.getSections().pipe(
					tap((res) => this.setSections(res.content)),
					catchError(() => {
						this.patchState({
							sectionsError:
								"Não foi possível carregar os setores. Tente novamente.",
						});
						return EMPTY;
					}),
					finalize(() => this.patchState({ sectionsLoading: false })),
				),
			),
		),
	);

	readonly getRooms = this.select((state) => state.rooms);
	readonly getSections = this.select((state) => state.section);
	readonly roomsLoading = this.select((state) => state.roomsLoading);
	readonly roomsError = this.select((state) => state.roomsError);
	readonly sectionsLoading = this.select((state) => state.sectionsLoading);
	readonly sectionsError = this.select((state) => state.sectionsError);

	readonly setRooms = this.updater((state, res: RoomResponseModel) => ({
		...state,
		rooms: res,
	}));

	readonly setSections = this.updater((state, sections: Section[]) => ({
		...state,
		section: sections,
	}));
}
