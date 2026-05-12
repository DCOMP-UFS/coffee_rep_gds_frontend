import { HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { ComponentStore } from "@ngrx/component-store";
import { CookieService } from "ngx-cookie-service";
import { EMPTY, Observable, catchError, switchMap, tap } from "rxjs";
import { environment } from "../../../environments/environment";
import { LoginRequestModel } from "../../core/models/login-request.model";
import { SignUpRequestModel } from "../../core/models/sign-up-request.model";
import { LoginService } from "../../core/services/login.service";
import { SnackBarService } from "../../core/services/snack-bar.service";
import { getSignUpErrorMessage } from "../../core/utils/http-error-message.util";

@Injectable()
export class LoginSignUpStore extends ComponentStore<object> {
	constructor(
		private loginService: LoginService,
		private cookieService: CookieService,
		private router: Router,
		private snackBar: SnackBarService,
	) {
		super();
	}

	readonly sendLoginRequest$ = this.effect(
		(payload$: Observable<LoginRequestModel>) =>
			payload$.pipe(
				switchMap((payload) =>
					this.loginService.login(payload).pipe(
						tap((res) => {
							this.cookieService.set(environment.tokenName, res.accessToken);
							this.router.navigate(["/rooms"]);
						}),
						catchError(() => {
							this.snackBar.openSnackBar(
								"CPF ou senha incorretos. Tente novamente.",
								"error",
							);
							return EMPTY;
						}),
					),
				),
			),
	);

	readonly sendSignUpRequest$ = this.effect(
		(payload$: Observable<SignUpRequestModel>) =>
			payload$.pipe(
				switchMap((payload) =>
					this.loginService.signUp(payload).pipe(
						tap(() => {
							this.snackBar.openSnackBar(
								"Cadastro realizado. Faça login com seu CPF e senha.",
							);
							this.router.navigate(["/login"], {
								queryParams: { registered: "1" },
							});
						}),
						catchError((error: HttpErrorResponse) => {
							this.snackBar.openSnackBar(getSignUpErrorMessage(error), "error");
							return EMPTY;
						}),
					),
				),
			),
	);
}
