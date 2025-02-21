import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        snackBar.open('Credenciais expiradas, por favor, realize o login novamente.', undefined ,{
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 5 * 1000
        });
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
