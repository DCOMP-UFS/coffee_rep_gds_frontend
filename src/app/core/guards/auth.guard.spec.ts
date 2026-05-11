import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { CookieService } from "ngx-cookie-service";
import { AuthGuard } from "./auth.guard";

describe("AuthGuard", () => {
	let guard: AuthGuard;
	let cookies: jasmine.SpyObj<CookieService>;
	let router: jasmine.SpyObj<Router>;

	beforeEach(() => {
		cookies = jasmine.createSpyObj("CookieService", ["get"]);
		router = jasmine.createSpyObj("Router", ["navigate"]);

		TestBed.configureTestingModule({
			providers: [
				AuthGuard,
				{ provide: CookieService, useValue: cookies },
				{ provide: Router, useValue: router },
			],
		});
		guard = TestBed.inject(AuthGuard);
	});

	it("allows navigation when token exists", () => {
		cookies.get.and.returnValue("token");
		expect(guard.canActivate()).toBeTrue();
	});

	it("redirects to login when token is missing", () => {
		cookies.get.and.returnValue("");
		expect(guard.canActivate()).toBeFalse();
		expect(router.navigate).toHaveBeenCalledWith(["/login"]);
	});
});
