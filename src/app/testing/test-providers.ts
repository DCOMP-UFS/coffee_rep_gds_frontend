import { provideHttpClient } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
} from "@angular/common/http/testing";
import { EnvironmentProviders, Provider } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { provideRouter } from "@angular/router";
import { LoaderService } from "../core/services/loader.service";

export function provideHttpTesting(): Array<Provider | EnvironmentProviders> {
	return [
		provideHttpClient(),
		provideHttpClientTesting(),
		provideNoopAnimations(),
	];
}

export function provideDialogTest(): Provider[] {
	return [
		{ provide: MatDialogRef, useValue: { close: jasmine.createSpy("close") } },
		{ provide: MAT_DIALOG_DATA, useValue: {} },
	];
}

export function provideComponentHttp(): Array<Provider | EnvironmentProviders> {
	return [
		...provideHttpTesting(),
		provideRouter([]),
		LoaderService,
		...provideDialogTest(),
	];
}

export { HttpTestingController };
