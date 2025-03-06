import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";

import { provideHttpClient, withInterceptors } from "@angular/common/http";
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
import { CookieService } from "ngx-cookie-service";
import { routes } from "./app.routes";
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

export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection({ eventCoalescing: true }),
		provideRouter(routes),
		provideHttpClient(),
		provideStore(),
		provideNativeDateAdapter(),
		CookieService,
		provideHttpClient(
			withInterceptors([authInterceptor, credentialsInterceptor]),
		),
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
