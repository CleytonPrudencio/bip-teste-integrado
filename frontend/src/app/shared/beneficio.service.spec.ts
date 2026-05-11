import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { BeneficioService } from './beneficio.service';
import { environment } from '../../environments/environment';

describe('BeneficioService', () => {
  let service: BeneficioService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BeneficioService
      ]
    });
    service = TestBed.inject(BeneficioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('deve construir URL paginada com page, size, sort', () => {
    service.list(1, 25, 'nome,desc').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/beneficios?page=1&size=25&sort=nome,desc`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('25');
    expect(req.request.params.get('sort')).toBe('nome,desc');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 1, size: 25 });
  });

  it('deve enviar POST para criar beneficio', () => {
    const payload = { nome: 'X', descricao: null, valor: 100, ativo: true };
    service.create(payload).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/beneficios`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 1, ...payload, version: 0 });
  });

  it('deve enviar PUT para atualizar beneficio', () => {
    service.update(7, { nome: 'Y', descricao: 'd', valor: 50, ativo: false }).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/beneficios/7`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('deve enviar DELETE para remover beneficio', () => {
    service.delete(9).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/beneficios/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('deve enviar POST para /transferencias', () => {
    service.transfer({ fromId: 1, toId: 2, amount: 50 }).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/transferencias`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ fromId: 1, toId: 2, amount: 50 });
    req.flush({});
  });

  it('historico sem beneficioId deve listar paginado', () => {
    service.historico({ page: 1, size: 5 }).subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === `${baseUrl}/transferencias` && r.params.get('page') === '1'
    );
    expect(req.request.params.has('beneficioId')).toBeFalse();
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 1, size: 5 });
  });

  it('historico com beneficioId deve passar como query param', () => {
    service.historico({ beneficioId: 7, page: 0, size: 10 }).subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === `${baseUrl}/transferencias` && r.params.get('beneficioId') === '7'
    );
    expect(req.request.params.get('beneficioId')).toBe('7');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 });
  });

  it('stats deve buscar /beneficios/{id}/stats', () => {
    service.stats(42).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/beneficios/42/stats`);
    expect(req.request.method).toBe('GET');
    req.flush({ beneficioId: 42, totalEnviado: 0, totalRecebido: 0, saldoLiquido: 0, totalTransferencias: 0 });
  });
});
