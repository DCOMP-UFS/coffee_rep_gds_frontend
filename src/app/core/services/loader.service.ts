import { Injectable } from "@angular/core";
import {
	BehaviorSubject,
	distinctUntilChanged,
	map,
	Observable,
	of,
	switchMap,
	timer,
} from "rxjs";

/**
 * Contador de requisições HTTP ativas. Evita que a primeira resposta
 * desligue o loading enquanto outras ainda estão em curso.
 */
@Injectable({
	providedIn: "root",
})
export class LoaderService {
	private readonly count$ = new BehaviorSubject<number>(0);

	/** Debounce evita “piscar” em requests muito rápidos */
	readonly loading$: Observable<boolean> = this.count$.pipe(
		map((n) => n > 0),
		distinctUntilChanged(),
	);

	/** True ~3s após iniciar loading (cold start / rede lenta) */
	readonly slowLoading$: Observable<boolean> = this.count$.pipe(
		switchMap((n) =>
			n > 0
				? timer(3000).pipe(map(() => true))
				: of(false),
		),
		distinctUntilChanged(),
	);

	start(): void {
		this.count$.next(this.count$.value + 1);
	}

	stop(): void {
		this.count$.next(Math.max(0, this.count$.value - 1));
	}

	/** Compatível com templates que ainda usam `loader.loader` síncrono */
	get loader(): boolean {
		return this.count$.value > 0;
	}
}
