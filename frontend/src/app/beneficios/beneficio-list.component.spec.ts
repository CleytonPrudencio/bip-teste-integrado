import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { BeneficioListComponent } from './beneficio-list.component';
import { environment } from '../../environments/environment';

describe('BeneficioListComponent', () => {
  let fixture: ComponentFixture<BeneficioListComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficioListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BeneficioListComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('deve carregar beneficios na inicializacao', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/api/v1/beneficios` && r.method === 'GET'
    );
    req.flush({
      content: [{ id: 1, nome: 'A', descricao: 'desc', valor: 100, ativo: true, version: 0 }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 100
    });

    expect(fixture.componentInstance.beneficios()).toEqual([
      { id: 1, nome: 'A', descricao: 'desc', valor: 100, ativo: true, version: 0 }
    ]);
    expect(fixture.componentInstance.loading()).toBeFalse();
  });

  it('deve renderizar mensagem de empty state quando lista vazia', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/api/v1/beneficios`
    );
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 100 });
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('Nenhum beneficio cadastrado');
  });
});
