import { Injectable } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { ComponentStore } from "@ngrx/component-store";
import {
	EMPTY,
	Observable,
	catchError,
	finalize,
	switchMap,
	tap,
} from "rxjs";
import { CreateRoomRequestModel } from "../../../core/models/create-room-request.model";
import { RoomService } from "../../../core/services/room.service";
import { SnackBarService } from "../../../core/services/snack-bar.service";
import { RoomDialogComponent } from "./room-dialog.component";

interface RoomDialogState {
	saving: boolean;
}

@Injectable()
export class RoomDialogComponentStore extends ComponentStore<RoomDialogState> {
	constructor(
		private roomService: RoomService,
		private snackBar: SnackBarService,
		public dialogRef: MatDialogRef<RoomDialogComponent>,
	) {
		super({ saving: false });
	}

	readonly saving$ = this.select((s) => s.saving);

	readonly createRoom$ = this.effect(
		(payload$: Observable<CreateRoomRequestModel>) => {
			return payload$.pipe(
				tap(() => this.patchState({ saving: true })),
				switchMap((req) =>
					this.roomService.createRoom(req).pipe(
						tap(() => this.dialogRef.close(true)),
						catchError(() => {
							this.snackBar.openSnackBar(
								"Não foi possível criar a sala. Tente novamente.",
							);
							return EMPTY;
						}),
						finalize(() => this.patchState({ saving: false })),
					),
				),
			);
		},
	);

	readonly updateRoom$ = this.effect(
		(payload$: Observable<CreateRoomRequestModel>) => {
			return payload$.pipe(
				tap(() => this.patchState({ saving: true })),
				switchMap((req) =>
					this.roomService.updateRoom(req).pipe(
						tap(() => this.dialogRef.close(true)),
						catchError(() => {
							this.snackBar.openSnackBar(
								"Não foi possível salvar a sala. Tente novamente.",
							);
							return EMPTY;
						}),
						finalize(() => this.patchState({ saving: false })),
					),
				),
			);
		},
	);
}
