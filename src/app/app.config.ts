import {
	HttpClient,
	provideHttpClient,
	withInterceptors,
} from "@angular/common/http";
import {
	APP_INITIALIZER,
	ApplicationConfig,
	provideZoneChangeDetection,
} from "@angular/core";
import {
	DateAdapter,
	ErrorStateMatcher,
	MAT_DATE_FORMATS,
	MAT_DATE_LOCALE,
	MatDateFormats,
} from "@angular/material/core";
import {
	MAT_FORM_FIELD_DEFAULT_OPTIONS,
} from "@angular/material/form-field";
import { PtBrDateAdapter } from "./core/adapters/pt-br-date.adapter";
import { ShowOnDirtyTouchedSubmittedMatcher } from "./core/i18n/show-on-dirty-touched-submitted.matcher";
import { MatPaginatorIntl } from "@angular/material/paginator";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideRouter } from "@angular/router";
import { provideStore } from "@ngrx/store";
import { CookieService } from "ngx-cookie-service";
import { provideEnvironmentNgxMask } from "ngx-mask";
import { catchError, firstValueFrom, of } from "rxjs";
import { environment } from "../environments/environment";
import { routes } from "./app.routes";
import { PtBrMatPaginatorIntl } from "./core/i18n/pt-br-mat-paginator-intl";
import { authInterceptor } from "./core/interceptors/auth.interceptor";
import { credentialsInterceptor } from "./core/interceptors/credentials.interceptor";

const MY_DATE_FORMATS: MatDateFormats = {
	parse: {
		dateInput: "DD/MM/YYYY",
	},
	display: {
		dateInput: "DD/MM/YYYY",
		monthYearLabel: "MMMM YYYY",
		dateA11yLabel: "LL",
		monthYearA11yLabel: "MMMM YYYY",
	},
};

export function warmupBackend(http: HttpClient): () => Promise<unknown> {
	return () =>
		firstValueFrom(
			http.get(`${environment.apiUrl}health`).pipe(catchError(() => of(null))),
		);
}

export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		provideHttpClient(
			withInterceptors([authInterceptor, credentialsInterceptor]),
		),
		provideStore(),
		{ provide: DateAdapter, useClass: PtBrDateAdapter },
		CookieService,
		provideEnvironmentNgxMask(),
		{
			provide: APP_INITIALIZER,
			useFactory: warmupBackend,
			deps: [HttpClient],
			multi: true,
		},
		{ provide: MAT_DATE_LOCALE, useValue: "pt-BR" },
		{ provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
		{
			provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
			useValue: { appearance: "outline", subscriptSizing: "dynamic" },
		},
		{
			provide: ErrorStateMatcher,
			useClass: ShowOnDirtyTouchedSubmittedMatcher,
		},
		{ provide: MatPaginatorIntl, useClass: PtBrMatPaginatorIntl },
		provideAnimationsAsync(),
	],
};
