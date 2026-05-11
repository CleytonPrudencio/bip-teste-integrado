import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  Beneficio,
  BeneficioRequest,
  Page,
  TransferRequest,
  TransferResponse,
  TransferenciaHistorico
} from './beneficio.model';

@Injectable({ providedIn: 'root' })
export class BeneficioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1`;

  list(page = 0, size = 20, sort = 'id,asc'): Observable<Page<Beneficio>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);
    return this.http.get<Page<Beneficio>>(`${this.baseUrl}/beneficios`, { params });
  }

  get(id: number): Observable<Beneficio> {
    return this.http.get<Beneficio>(`${this.baseUrl}/beneficios/${id}`);
  }

  create(payload: BeneficioRequest): Observable<Beneficio> {
    return this.http.post<Beneficio>(`${this.baseUrl}/beneficios`, payload);
  }

  update(id: number, payload: BeneficioRequest): Observable<Beneficio> {
    return this.http.put<Beneficio>(`${this.baseUrl}/beneficios/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/beneficios/${id}`);
  }

  transfer(payload: TransferRequest): Observable<TransferResponse> {
    return this.http.post<TransferResponse>(`${this.baseUrl}/transferencias`, payload);
  }

  historico(page = 0, size = 20): Observable<Page<TransferenciaHistorico>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<TransferenciaHistorico>>(`${this.baseUrl}/transferencias`, { params });
  }
}
