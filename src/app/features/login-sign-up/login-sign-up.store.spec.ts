import { HttpErrorResponse } from "@angular/common/http";
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
		loginService.login.and.returnValue(
			of({ accessToken: "jwt", expiresIn: 3600 }),
		);

		store.sendLoginRequest$({ cpf: "17055661030", password: "1234" });

		expect(cookies.set).toHaveBeenCalledWith(environment.tokenName, "jwt");
		expect(router.navigate).toHaveBeenCalledWith(["/rooms"]);
	});

	it("shows snackbar on login error", () => {
		loginService.login.and.returnValue(throwError(() => new Error("fail")));

		store.sendLoginRequest$({ cpf: "1", password: "2" });

		expect(snackBar.openSnackBar).toHaveBeenCalledWith(
			"CPF ou senha incorretos. Tente novamente.",
			"error",
		);
	});

	it("shows API message on sign-up error", () => {
		loginService.signUp.and.returnValue(
			throwError(
				() =>
					new HttpErrorResponse({
						error: { message: "Este CPF já está cadastrado." },
						status: 400,
					}),
			),
		);

		store.sendSignUpRequest$({
			name: "Maria",
			phone: "79998887766",
			password: "Teste@1234",
			email: "maria@example.com",
			cpf: "17055661030",
			birthDate: "1990-03-15",
		});

		expect(snackBar.openSnackBar).toHaveBeenCalledWith(
			"Este CPF já está cadastrado.",
			"error",
		);
	});

	it("shows API message when email is already registered", () => {
		loginService.signUp.and.returnValue(
			throwError(
				() =>
					new HttpErrorResponse({
						error: { message: "Este e-mail já está cadastrado." },
						status: 400,
					}),
			),
		);

		store.sendSignUpRequest$({
			name: "Maria",
			phone: "79998887766",
			password: "Teste@1234",
			email: "maria@example.com",
			cpf: "31833783026",
			birthDate: "1990-03-15",
		});

		expect(snackBar.openSnackBar).toHaveBeenCalledWith(
			"Este e-mail já está cadastrado.",
			"error",
		);
	});

	it("maps raw duplicate email persistence errors to a clear message", () => {
		loginService.signUp.and.returnValue(
			throwError(
				() =>
					new HttpErrorResponse({
						error: {
							message:
								'could not execute statement [ERROR: duplicate key value violates unique constraint "unique_email" Detalhe: Key (email)=(admin@admin.com) already exists.]',
						},
						status: 409,
					}),
			),
		);

		store.sendSignUpRequest$({
			name: "Maria",
			phone: "79998887766",
			password: "Teste@1234",
			email: "admin@admin.com",
			cpf: "52998224725",
			birthDate: "1990-03-15",
		});

		expect(snackBar.openSnackBar).toHaveBeenCalledWith(
			"Este e-mail já está cadastrado.",
			"error",
		);
	});

	it("maps legacy duplicate CPF responses to a clear message", () => {
		loginService.signUp.and.returnValue(
			throwError(
				() =>
					new HttpErrorResponse({
						error: { message: "422 UNPROCESSABLE_ENTITY" },
						status: 500,
					}),
			),
		);

		store.sendSignUpRequest$({
			name: "Maria",
			phone: "79998887766",
			password: "Teste@1234",
			email: "maria@example.com",
			cpf: "17055661030",
			birthDate: "1990-03-15",
		});

		expect(snackBar.openSnackBar).toHaveBeenCalledWith(
			"Este CPF já está cadastrado.",
			"error",
		);
	});
});
