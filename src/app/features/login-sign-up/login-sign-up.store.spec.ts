import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { CookieService } from "ngx-cookie-service";
import { of, throwError } from "rxjs";
import { environment } from "../../../environments/environment";
import { LoginService } from "../../core/services/login.service";
import { SnackBarService } from "../../core/services/snack-bar.service";
import { LoginSignUpStore } from "./login-sign-up.store";

describe("LoginSignUpStore", () => {
	let store: LoginSignUpStore;
	let loginService: jasmine.SpyObj<LoginService>;
	let cookies: jasmine.SpyObj<CookieService>;
	let router: jasmine.SpyObj<Router>;
	let snackBar: jasmine.SpyObj<SnackBarService>;

	beforeEach(() => {
		loginService = jasmine.createSpyObj("LoginService", ["login", "signUp"]);
		cookies = jasmine.createSpyObj("CookieService", ["set"]);
		router = jasmine.createSpyObj("Router", ["navigate"]);
		snackBar = jasmine.createSpyObj("SnackBarService", ["openSnackBar"]);

		TestBed.configureTestingModule({
			providers: [
				LoginSignUpStore,
				{ provide: LoginService, useValue: loginService },
				{ provide: CookieService, useValue: cookies },
				{ provide: Router, useValue: router },
				{ provide: SnackBarService, useValue: snackBar },
			],
		});
		store = TestBed.inject(LoginSignUpStore);
	});

	it("stores token and navigates on successful login", () => {
		loginService.login.and.returnValue(of({ accessToken: "jwt", expiresIn: 3600 }));

		store.sendLoginRequest$({ cpf: "17055661030", password: "1234" });

		expect(cookies.set).toHaveBeenCalledWith(environment.tokenName, "jwt");
		expect(router.navigate).toHaveBeenCalledWith(["/rooms"]);
	});

	it("shows snackbar on login error", () => {
		loginService.login.and.returnValue(throwError(() => new Error("fail")));

		store.sendLoginRequest$({ cpf: "1", password: "2" });

		expect(snackBar.openSnackBar).toHaveBeenCalled();
	});
});
