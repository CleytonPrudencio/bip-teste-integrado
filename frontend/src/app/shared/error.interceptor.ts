import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ToastService } from './toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = extractMessage(error);
      toast.error(message);
      return throwError(() => error);
    })
  );
};

function extractMessage(error: HttpErrorResponse): string {
  if (error.error && typeof error.error === 'object' && 'message' in error.error) {
    return String(error.error.message);
  }
  if (typeof error.error === 'string' && error.error.length) {
    return error.error;
  }
  if (error.status === 0) {
    return 'Nao foi possivel conectar ao servidor.';
  }
  return `Erro ${error.status}: ${error.statusText || 'falha na requisicao'}`;
}
