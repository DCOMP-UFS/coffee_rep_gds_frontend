import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router, provideRouter } from "@angular/router";
import { CookieService } from "ngx-cookie-service";
import { provideEnvironmentNgxMask } from "ngx-mask";
import { Subject } from "rxjs";
import { provideComponentHttp } from "../../testing/test-providers";
import { LoginSignUpComponent } from "./login-sign-up.component";
import { LoginSignUpStore } from "./login-sign-up.store";

describe("LoginSignUpComponent", () => {
	let queryParams$: Subject<Record<string, string>>;
	let router: Router;

	beforeEach(async () => {
		queryParams$ = new Subject<Record<string, string>>();
		await TestBed.configureTestingModule({
			imports: [LoginSignUpComponent],
			providers: [
				...provideComponentHttp(),
				provideRouter([
					{ path: "login", component: LoginSignUpComponent },
					{ path: "cadastro", component: LoginSignUpComponent },
				]),
				provideEnvironmentNgxMask(),
				LoginSignUpStore,
				{
					provide: CookieService,
					useValue: jasmine.createSpyObj("CookieService", ["get", "deleteAll"]),
				},
				{
					provide: ActivatedRoute,
					useValue: { queryParams: queryParams$.asObservable() },
				},
			],
		})
			.overrideComponent(LoginSignUpComponent, {
				set: { providers: [] },
			})
			.compileComponents();

		router = TestBed.inject(Router);
	});

	it("should create", () => {
		const fixture = TestBed.createComponent(LoginSignUpComponent);
		expect(fixture.componentInstance).toBeTruthy();
	});

	it("should open sign-up mode on /cadastro", async () => {
		await router.navigateByUrl("/cadastro");
		const fixture = TestBed.createComponent(LoginSignUpComponent);
		fixture.componentInstance.ngOnInit();
		expect(fixture.componentInstance.isSignUp).toBeTrue();
	});

	it("should toggle login password visibility", () => {
		const fixture = TestBed.createComponent(LoginSignUpComponent);
		const component = fixture.componentInstance;
		expect(component.loginPasswordInputType).toBe("password");
		component.toggleLoginPasswordVisibility();
		expect(component.loginPasswordInputType).toBe("text");
		component.toggleLoginPasswordVisibility();
		expect(component.loginPasswordInputType).toBe("password");
	});

	it("should toggle sign-up password visibility", () => {
		const fixture = TestBed.createComponent(LoginSignUpComponent);
		const component = fixture.componentInstance;
		expect(component.signUpPasswordInputType).toBe("password");
		component.toggleSignUpPasswordVisibility();
		expect(component.signUpPasswordInputType).toBe("text");
	});

	it("should keep login mode on /login when registered query param is set", async () => {
		await router.navigateByUrl("/login?registered=1");
		const fixture = TestBed.createComponent(LoginSignUpComponent);
		fixture.componentInstance.ngOnInit();
		queryParams$.next({ registered: "1" });
		expect(fixture.componentInstance.isSignUp).toBeFalse();
	});
});
