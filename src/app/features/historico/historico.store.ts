import { Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";
import {
	EMPTY,
	Observable,
	catchError,
	finalize,
	switchMap,
	tap,
} from "rxjs";
import {
	AuditRequestParams,
	AuditResponseModel,
} from "../../core/models/audit-response.model";
import { AuditService } from "../../core/services/audit.service";

interface HistoricoState {
	events: AuditResponseModel;
	lastParams: AuditRequestParams | null;
	loading: boolean;
	error: string | null;
}

const emptyEvents = (): AuditResponseModel => ({
	content: [],
	page: {
		totalElements: 0,
		totalPages: 0,
		size: 10,
		number: 0,
	},
});

@Injectable()
export class HistoricoComponentStore extends ComponentStore<HistoricoState> {
	constructor(private auditService: AuditService) {
		super({
			events: emptyEvents(),
			lastParams: null,
			loading: false,
			error: null,
		});
	}

	readonly getEvents$ = this.effect(
		(payload$: Observable<AuditRequestParams>) => {
			return payload$.pipe(
				tap(() => this.patchState({ loading: true, error: null })),
				switchMap((req) => {
					this.patchState({ lastParams: req });
					return this.auditService.getEvents(req).pipe(
						tap((res) => this.setEvents(res)),
						catchError(() => {
							this.patchState({
								error:
									"Não foi possível carregar o histórico. Verifique a conexão e tente novamente.",
							});
							return EMPTY;
						}),
						finalize(() => this.patchState({ loading: false })),
					);
				}),
			);
		},
	);

	readonly getEvents = this.select((state) => state.events);
	readonly loading = this.select((state) => state.loading);
	readonly error = this.select((state) => state.error);

	readonly setEvents = this.updater((state, res: AuditResponseModel) => ({
		...state,
		events: res,
	}));
}
