import { HttpInterceptorFn } from "@angular/common/http";
import { HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { getHttpErrorMessage } from "../utils/http-error-message.util";
import { SnackBarService } from "../services/snack-bar.service";

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
	const router = inject(Router);
	const snackBar = inject(SnackBarService);
	return next(req).pipe(
		catchError((error: HttpErrorResponse) => {
			const isAuthEndpoint =
				req.url.includes("auth/login") || req.url.includes("auth/register");
			if (isAuthEndpoint) {
				return throwError(() => error);
			}

			if (error.status === 401) {
				snackBar.openSnackBar(
					getHttpErrorMessage(
						error,
						"Credenciais expiradas, por favor, realize o login novamente.",
					),
					"error",
				);
				router.navigate(["/login"]);
			} else {
				snackBar.openSnackBar(
					getHttpErrorMessage(
						error,
						"Não foi possível concluir a operação.",
					),
					"error",
				);
			}
			return throwError(() => error);
		}),
	);
};
