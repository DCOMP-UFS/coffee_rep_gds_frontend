import { TestBed } from "@angular/core/testing";
import { environment } from "../../../environments/environment";
import {
	HttpTestingController,
	provideHttpTesting,
} from "../../testing/test-providers";
import { SectionService } from "./section.service";
import { HttpService } from "./http.service";
import { LoaderService } from "./loader.service";

describe("SectionService", () => {
	let service: SectionService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [SectionService, HttpService, LoaderService, ...provideHttpTesting()],
		});
		service = TestBed.inject(SectionService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => httpMock.verify());

	it("normalizes array response into content", () => {
		service.getSections().subscribe((res) => {
			expect(res.content.length).toBe(1);
			expect(res.content[0].nome).toBe("Setor A");
		});

		const req = httpMock.expectOne(
			(r) => r.url === `${environment.apiUrl}section` && r.params.get("unpaged") === "true",
		);
		req.flush([{ id: 1, nome: "Setor A", observacoes: "" }]);
	});

	it("keeps paged response shape", () => {
		service.getSections().subscribe((res) => {
			expect(res.content.length).toBe(1);
		});

		const req = httpMock.expectOne(`${environment.apiUrl}section?unpaged=true`);
		req.flush({ content: [{ id: 2, nome: "Setor B", observacoes: "" }] });
	});
});
