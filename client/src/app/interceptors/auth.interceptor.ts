import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const isAuthEndpoint = req.url.includes('/login') || req.url.includes('/register');

  if (token && !isAuthEndpoint) {
    const authReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token
      }
    });

    return next(authReq).pipe(
      tap(() => {}),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && token) {
          authService.logout();
        }
        return throwError(() => error);
      })
    );
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
