import {Injectable} from "@angular/core";
import {ComponentStore} from "@ngrx/component-store";
import {catchError, EMPTY, Observable, switchMap, tap} from "rxjs";
import {CookieService} from "ngx-cookie-service";
import {environment} from "../../../environments/environment";
import {Router} from "@angular/router";
import {LoginService} from '../../core/services/login.service';
import {LoginRequestModel} from '../../core/models/login-request.model';


@Injectable()
export class LoginSignUpStore extends ComponentStore<object> {

  constructor(
    private loginService: LoginService,
    private cookieService: CookieService,
    private router: Router
  ) {
    super();
  }

  readonly sendLoginRequest$ = this.effect((payload$: Observable<LoginRequestModel>) =>
    payload$.pipe(
      switchMap(
        payload => this.loginService.login(payload).pipe(
          tap(res => {
            this.cookieService.set(environment.tokenName, res.accessToken);
            this.router.navigate(['/home'])
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
