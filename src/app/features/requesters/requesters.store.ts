import { Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";
import { EMPTY, Observable, catchError, of, switchMap, tap } from "rxjs";
import { RequesterRequestParamsModel } from "../../core/models/requester-request-params.model";
import { RequesterResponseModel } from "../../core/models/requester-response.model";
import { RequesterService } from "../../core/services/requester.service";
import { SnackBarService } from "../../core/services/snack-bar.service";

interface RequesterState {
	requesters: RequesterResponseModel;
	lastRequesterParams: RequesterRequestParamsModel | null;
}

const emptyRequesters = (): RequesterResponseModel => ({
	content: [],
	page: {
		totalElements: 0,
		totalPages: 0,
		size: 5,
		number: 0,
	},
});

@Injectable()
export class RequestersComponentStore extends ComponentStore<RequesterState> {
	constructor(
		private requesterService: RequesterService,
		private snackBar: SnackBarService,
	) {
		super({
			requesters: emptyRequesters(),
			lastRequesterParams: null,
		});
	}

	readonly getRequester$ = this.effect(
		(payload$: Observable<RequesterRequestParamsModel>) => {
			return payload$.pipe(
				tap((req) => this.patchState({ lastRequesterParams: req })),
				switchMap((req) =>
					this.requesterService.getRequesters(req).pipe(
						tap((res) => this.setRequesters(res)),
						catchError(() => {
							return EMPTY;
						}),
					),
				),
			);
		},
	);

	readonly deleteRequester$ = this.effect(
		(payload$: Observable<{ requesterId: number }>) => {
			return payload$.pipe(
				switchMap((req) => {
					const last = this.get().lastRequesterParams;
					return this.requesterService.deleteRequester(req.requesterId).pipe(
						tap(() => {
							this.snackBar.openSnackBar("Solicitante excluído com sucesso.");
							if (last) {
								this.getRequester$(of(last));
							}
						}),
						catchError(() => {
							this.snackBar.openSnackBar(
								"Não foi possível excluir o solicitante. Tente novamente.",
							);
							return EMPTY;
						}),
					);
				}),
			);
		},
	);

	/** Refetch using the last pagination/filter params (avoids full page reload). */
	refetch(): void {
		const last = this.get().lastRequesterParams;
		if (last) {
			this.getRequester$(of(last));
		}
	}

	readonly getRequesters = this.select((state) => state.requesters);

	readonly setRequesters = this.updater(
		(state, requesters: RequesterResponseModel) => ({
			...state,
			requesters,
		}),
	);
}
