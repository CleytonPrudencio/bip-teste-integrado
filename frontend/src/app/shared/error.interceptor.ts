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
    const message = String(error.error.message);
    if (message.trim().length > 0) {
      return message;
    }
  }
  if (typeof error.error === 'string' && error.error.length) {
    return error.error;
  }
  if (error.status === 0) {
    return 'Nao foi possivel conectar ao servidor. Verifique sua conexao.';
  }
  if (error.status === 400) return 'Dados invalidos. Revise o formulario.';
  if (error.status === 401) return 'Sessao expirada. Faca login novamente.';
  if (error.status === 403) return 'Voce nao tem permissao para essa acao.';
  if (error.status === 404) return 'Registro nao encontrado.';
  if (error.status === 409) return 'Conflito ao processar. Recarregue e tente novamente.';
  if (error.status === 422) return 'Operacao nao permitida no momento.';
  if (error.status >= 500) return 'Erro interno do servidor. Tente novamente em instantes.';
  return `Falha na requisicao (HTTP ${error.status}).`;
}
