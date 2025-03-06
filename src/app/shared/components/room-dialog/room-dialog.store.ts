import { Injectable } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { ComponentStore } from "@ngrx/component-store";
import { EMPTY, Observable, catchError, switchMap, tap } from "rxjs";
import { CreateRoomRequestModel } from "../../../core/models/create-room-request.model";
import { RoomService } from "../../../core/services/room.service";
import { RoomDialogComponent } from "./room-dialog.component";

@Injectable()
export class RoomDialogComponentStore extends ComponentStore<object> {
	constructor(
		private roomService: RoomService,
		public dialogRef: MatDialogRef<RoomDialogComponent>,
	) {
		super();
	}

	readonly createRoom$ = this.effect(
		(payload$: Observable<CreateRoomRequestModel>) => {
			return payload$.pipe(
				switchMap((req) =>
					this.roomService.createRoom(req).pipe(
						tap(() => this.dialogRef.close()),
						catchError(() => {
							return EMPTY;
						}),
					),
				),
			);
		},
	);

	readonly updateRoom$ = this.effect(
		(payload$: Observable<CreateRoomRequestModel>) => {
			return payload$.pipe(
				switchMap((req) =>
					this.roomService.updateRoom(req).pipe(
						tap(() => this.dialogRef.close()),
						catchError(() => {
							return EMPTY;
						}),
					),
				),
			);
		},
	);
}
