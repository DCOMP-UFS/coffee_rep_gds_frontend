import { TestBed } from "@angular/core/testing";
import { environment } from "../../../environments/environment";
import {
	HttpTestingController,
	provideHttpTesting,
} from "../../testing/test-providers";
import { HttpService } from "./http.service";
import { LoaderService } from "./loader.service";
import { RequesterAbsenceHttpService } from "./requester-absence-http.service";

describe("RequesterAbsenceHttpService", () => {
	let service: RequesterAbsenceHttpService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				RequesterAbsenceHttpService,
				HttpService,
				LoaderService,
				...provideHttpTesting(),
			],
		});
		service = TestBed.inject(RequesterAbsenceHttpService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => httpMock.verify());

	it("lists absences with optional solicitanteId", () => {
		service.list(3).subscribe((rows) => expect(rows.length).toBe(1));

		const req = httpMock.expectOne(
			`${environment.apiUrl}requester-absence?solicitanteId=3`,
		);
		req.flush([
			{
				id: 1,
				solicitanteId: 3,
				solicitanteNome: "Dr.",
				dataInicio: "2026-01-01",
				dataFim: "2026-01-02",
			},
		]);
	});

	it("creates absence", () => {
		service
			.create({
				solicitanteId: 1,
				dataInicio: "2026-01-01",
				dataFim: "2026-01-02",
			})
			.subscribe();

		const req = httpMock.expectOne(`${environment.apiUrl}requester-absence`);
		expect(req.request.method).toBe("POST");
		req.flush(null);
	});
});
