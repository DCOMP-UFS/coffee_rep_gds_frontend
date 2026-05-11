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
import { provideRouter } from "@angular/router";
import {
	MAT_DATE_FORMATS,
	MAT_DATE_LOCALE,
	MatDateFormats,
	provideNativeDateAdapter,
} from "@angular/material/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from "@angular/material/form-field";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideStore } from "@ngrx/store";
import { provideEnvironmentNgxMask } from "ngx-mask";
import { CookieService } from "ngx-cookie-service";
import { catchError, firstValueFrom, of } from "rxjs";
import { routes } from "./app.routes";
import { authInterceptor } from "./core/interceptors/auth.interceptor";
import { credentialsInterceptor } from "./core/interceptors/credentials.interceptor";
import { environment } from "../environments/environment";

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
			http
				.get(`${environment.apiUrl}health`)
				.pipe(catchError(() => of(null))),
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
		provideNativeDateAdapter(),
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
		{ provide: MAT_DIALOG_DATA, useValue: {} },
		{ provide: MatDialogRef, useValue: {} },
		{
			provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
			useValue: { appearance: "outline" },
		},
		provideAnimationsAsync(),
	],
};
