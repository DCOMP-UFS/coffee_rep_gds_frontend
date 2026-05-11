import { TestBed } from "@angular/core/testing";
import { environment } from "../../../environments/environment";
import {
	HttpTestingController,
	provideHttpTesting,
} from "../../testing/test-providers";
import { HttpService } from "./http.service";
import { LoaderService } from "./loader.service";

describe("HttpService", () => {
	let service: HttpService;
	let httpMock: HttpTestingController;
	let loader: LoaderService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [HttpService, LoaderService, ...provideHttpTesting()],
		});
		service = TestBed.inject(HttpService);
		httpMock = TestBed.inject(HttpTestingController);
		loader = TestBed.inject(LoaderService);
	});

	afterEach(() => httpMock.verify());

	it("starts and stops loader around getWithLoader", () => {
		const values: boolean[] = [];
		const sub = loader.loading$.subscribe((v) => values.push(v));

		service.getWithLoader<unknown>("room").subscribe();
		expect(values.at(-1)).toBeTrue();

		httpMock.expectOne(`${environment.apiUrl}room`).flush({});
		expect(values.at(-1)).toBeFalse();
		sub.unsubscribe();
	});
});
