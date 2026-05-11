import { TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { CookieService } from "ngx-cookie-service";
import { of } from "rxjs";
import { provideComponentHttp } from "../../testing/test-providers";
import { LoginSignUpComponent } from "./login-sign-up.component";
import { LoginSignUpStore } from "./login-sign-up.store";

describe("LoginSignUpComponent", () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [LoginSignUpComponent],
			providers: [
				...provideComponentHttp(),
				LoginSignUpStore,
				{
					provide: CookieService,
					useValue: jasmine.createSpyObj("CookieService", ["get", "deleteAll"]),
				},
				{ provide: ActivatedRoute, useValue: { queryParams: of({}) } },
			],
		})
			.overrideComponent(LoginSignUpComponent, {
				set: { providers: [] },
			})
			.compileComponents();
	});

	it("should create", () => {
		const fixture = TestBed.createComponent(LoginSignUpComponent);
		expect(fixture.componentInstance).toBeTruthy();
	});
});
