import { Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";
import { EMPTY, Observable, catchError, switchMap, tap } from "rxjs";
import { RequesterRequestParamsModel } from "../../core/models/requester-request-params.model";
import { RequesterResponseModel } from "../../core/models/requester-response.model";
import { RequesterService } from "../../core/services/requester.service";

interface RequesterState {
	requester: RequesterResponseModel;
}

@Injectable()
export class RequestersComponentStore extends ComponentStore<RequesterState> {
	constructor(private requesterService: RequesterService) {
		super({ requester: {} as RequesterResponseModel });
	}

	readonly getRequester$ = this.effect(
		(payload$: Observable<RequesterRequestParamsModel>) => {
			return payload$.pipe(
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
					return this.requesterService.deleteRequester(req.requesterId).pipe(
						tap(() => window.location.reload()),
						catchError(() => {
							return EMPTY;
						}),
					);
				}),
			);
		},
	);

	readonly getRequesters = this.select((state) => state.requester);

	readonly setRequesters = this.updater(
		(state, requesters: RequesterResponseModel) => ({
			...state,
			requester: requesters,
		}),
	);
}
