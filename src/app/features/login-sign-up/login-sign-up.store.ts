import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { ComponentStore } from "@ngrx/component-store";
import { CookieService } from "ngx-cookie-service";
import { EMPTY, Observable, catchError, switchMap, tap } from "rxjs";
import { environment } from "../../../environments/environment";
import { LoginRequestModel } from "../../core/models/login-request.model";
import { SignUpRequestModel } from "../../core/models/sign-up-request.model";
import { LoginService } from "../../core/services/login.service";

@Injectable()
export class LoginSignUpStore extends ComponentStore<object> {
	constructor(
		private loginService: LoginService,
		private cookieService: CookieService,
		private router: Router,
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
							this.router.navigate(["/home"]);
						}),
						catchError(() => {
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
						tap((res) => {
							this.cookieService.set("JJToken", res.accessToken);
						}),
						catchError(() => {
							return EMPTY;
						}),
					),
				),
			),
	);
}
