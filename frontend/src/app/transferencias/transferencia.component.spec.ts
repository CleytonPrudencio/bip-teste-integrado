import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { TransferenciaComponent } from './transferencia.component';
import { environment } from '../../environments/environment';

describe('TransferenciaComponent', () => {
  let fixture: ComponentFixture<TransferenciaComponent>;
  let httpMock: HttpTestingController;

  const beneficiosUrl = `${environment.apiUrl}/api/v1/beneficios`;
  const historicoUrl = `${environment.apiUrl}/api/v1/transferencias`;

  function flushBootstrapCalls(): void {
    httpMock.expectOne((r) => r.url === beneficiosUrl).flush({
      content: [
        { id: 1, nome: 'A', descricao: null, valor: 1000, ativo: true, version: 0 },
        { id: 2, nome: 'B', descricao: null, valor: 500, ativo: true, version: 0 }
      ],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 100
    });
    httpMock.expectOne((r) => r.url === historicoUrl && r.method === 'GET').flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 10
    });
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferenciaComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(TransferenciaComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    flushBootstrapCalls();
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('deve detectar quando origem e destino sao iguais', () => {
    fixture.componentInstance.form.patchValue({ fromId: 1, toId: 1, amount: 10 });
    expect(fixture.componentInstance.mesmoOrigemDestino()).toBeTrue();
  });

  it('formulario deve ser invalido sem campos obrigatorios', () => {
    expect(fixture.componentInstance.form.valid).toBeFalse();
  });

  it('deve postar transferencia e recarregar listas quando submetida', () => {
    fixture.componentInstance.form.patchValue({ fromId: 1, toId: 2, amount: 50 });
    fixture.componentInstance.executar();

    const post = httpMock.expectOne(historicoUrl);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ fromId: 1, toId: 2, amount: 50 });
    post.flush({
      fromId: 1,
      toId: 2,
      amount: 50,
      fromValorFinal: 950,
      toValorFinal: 550,
      executadoEm: new Date().toISOString()
    });

    httpMock.expectOne((r) => r.url === beneficiosUrl).flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 100
    });
    httpMock.expectOne((r) => r.url === historicoUrl && r.method === 'GET').flush({
      content: [
        { id: 7, fromId: 1, fromNome: 'A', toId: 2, toNome: 'B', amount: 50,
          fromValorFinal: 950, toValorFinal: 550, executadoEm: new Date().toISOString() }
      ],
      totalElements: 1, totalPages: 1, number: 0, size: 10
    });

    expect(fixture.componentInstance.ultimaTransferencia()?.fromValorFinal).toBe(950);
    expect(fixture.componentInstance.historico().length).toBe(1);
  });

  it('deve formatar timestamp do historico para o locale pt-BR', () => {
    const result = fixture.componentInstance.formatTime('2026-05-11T14:30:00.000Z');
    expect(result).toMatch(/\d{2}\/\d{2}/);
  });
});
