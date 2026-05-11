import { HttpClient, provideHttpClient, withInterceptors } from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { CookieService } from "ngx-cookie-service";
import { authInterceptor } from "./auth.interceptor";

describe("authInterceptor", () => {
	let http: HttpClient;
	let httpMock: HttpTestingController;
	let cookies: jasmine.SpyObj<CookieService>;

	beforeEach(() => {
		cookies = jasmine.createSpyObj("CookieService", ["get"]);
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(withInterceptors([authInterceptor])),
				provideHttpClientTesting(),
				{ provide: CookieService, useValue: cookies },
			],
		});
		http = TestBed.inject(HttpClient);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => httpMock.verify());

	it("adds bearer token for non-login requests", () => {
		cookies.get.and.returnValue("abc");
		http.get("/api/room").subscribe();
		const req = httpMock.expectOne("/api/room");
		expect(req.request.headers.get("Authorization")).toBe("Bearer abc");
		req.flush({});
	});

	it("does not add bearer token for login requests", () => {
		cookies.get.and.returnValue("abc");
		http.post("/api/auth/login", {}).subscribe();
		const req = httpMock.expectOne("/api/auth/login");
		expect(req.request.headers.has("Authorization")).toBeFalse();
		req.flush({});
	});
});
