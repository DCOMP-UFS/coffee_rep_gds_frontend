import { Injectable } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { ComponentStore } from "@ngrx/component-store";
import { EMPTY, Observable, catchError, switchMap, tap } from "rxjs";
import { RequesterRequestModel } from "../../../core/models/requester-request.model";
import { RequesterService } from "../../../core/services/requester.service";
import { RequesterDialogComponent } from "./requester-dialog.component";

@Injectable()
export class RequesterDialogComponentStore extends ComponentStore<object> {
	constructor(
		private requesterService: RequesterService,
		public dialogRef: MatDialogRef<RequesterDialogComponent>,
	) {
		super();
	}

	readonly createRequester$ = this.effect(
		(payload$: Observable<RequesterRequestModel>) => {
			return payload$.pipe(
				switchMap((req) =>
					this.requesterService.createRequester(req).pipe(
						tap(() => this.dialogRef.close(true)),
						catchError(() => {
							return EMPTY;
						}),
					),
				),
			);
		},
	);

	readonly updateRequester$ = this.effect(
		(payload$: Observable<RequesterRequestModel>) => {
			return payload$.pipe(
				switchMap((req) =>
					this.requesterService.updateRequester(req).pipe(
						tap(() => this.dialogRef.close(true)),
						catchError(() => {
							return EMPTY;
						}),
					),
				),
			);
		},
	);
}
