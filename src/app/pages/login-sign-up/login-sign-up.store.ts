import {Injectable} from "@angular/core";
import {ComponentStore} from "@ngrx/component-store";
import {LoginService} from "../../services/login.service";
import {catchError, EMPTY, Observable, switchMap, tap} from "rxjs";
import {LoginRequestModel} from "../../models/login-request.model";
import {CookieService} from "ngx-cookie-service";


@Injectable()
export class LoginSignUpStore extends ComponentStore<object>{

  constructor(
    private loginService: LoginService,
    private cookieService: CookieService,
  ) {
    super();
  }

  readonly sendLoginRequest$ = this.effect((payload$: Observable<LoginRequestModel>) =>
    payload$.pipe(
      switchMap(
        payload => this.loginService.login(payload).pipe(
          tap(res => {
            this.cookieService.set('JJToken', res.accessToken);
          }),
          catchError(err => {
            return EMPTY;
          })
        )
      ),
    )
  );

  readonly sendSignUpRequest$ = this.effect((payload$: Observable<any>) =>
    payload$.pipe(
      switchMap(
        payload => this.loginService.signUp(payload).pipe(
          tap(res => {
            this.cookieService.set('JJToken', res.accessToken);
          }),
          catchError(err => {
            return EMPTY;
          })
        )
      ),
    )
  );

}
