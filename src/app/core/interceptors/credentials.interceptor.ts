import { HttpInterceptorFn } from "@angular/common/http";
import { HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
	const router = inject(Router);
	const snackBar = inject(MatSnackBar);
	return next(req).pipe(
		catchError((error: HttpErrorResponse) => {
			if (error.status === 401) {
				snackBar.open(
					error?.error?.message ||
						"Credenciais expiradas, por favor, realize o login novamente.",
					undefined,
					{
						horizontalPosition: "right",
						verticalPosition: "top",
						duration: 5 * 1000,
					},
				);
				router.navigate(["/login"]);
			} else {
				snackBar.open(error.error.message, undefined, {
					horizontalPosition: "right",
					verticalPosition: "top",
					duration: 5 * 1000,
				});
			}
			return throwError(() => error);
		}),
	);
};
