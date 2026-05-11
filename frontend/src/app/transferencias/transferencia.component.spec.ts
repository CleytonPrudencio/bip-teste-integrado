import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TransferenciaComponent } from './transferencia.component';
import { environment } from '../../environments/environment';

describe('TransferenciaComponent', () => {
  let fixture: ComponentFixture<TransferenciaComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferenciaComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(TransferenciaComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/api/v1/beneficios`);
    req.flush({
      content: [
        { id: 1, nome: 'A', descricao: null, valor: 1000, ativo: true, version: 0 },
        { id: 2, nome: 'B', descricao: null, valor: 500, ativo: true, version: 0 }
      ],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 100
    });
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

  it('deve postar transferencia quando submetida', () => {
    fixture.componentInstance.form.patchValue({ fromId: 1, toId: 2, amount: 50 });
    fixture.componentInstance.executar();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/transferencias`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ fromId: 1, toId: 2, amount: 50 });
    req.flush({
      fromId: 1,
      toId: 2,
      amount: 50,
      fromValorFinal: 950,
      toValorFinal: 550,
      executadoEm: new Date().toISOString()
    });

    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/api/v1/beneficios`).flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 100
    });

    expect(fixture.componentInstance.ultimaTransferencia()?.fromValorFinal).toBe(950);
  });
});
