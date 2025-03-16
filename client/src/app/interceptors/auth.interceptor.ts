import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });

    return next(authReq).pipe(
      tap(response => {
      }),
      catchError(error => {

        return throwError(() => error);
      })
    );
  }

  return next(req);
};
