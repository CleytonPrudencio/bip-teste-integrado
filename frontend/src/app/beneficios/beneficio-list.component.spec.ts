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

  it('deve carregar beneficios paginados na inicializacao', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/api/v1/beneficios` && r.method === 'GET'
    );
    req.flush({
      content: [{ id: 1, nome: 'A', descricao: 'desc', valor: 100, ativo: true, version: 0 }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10
    });

    expect(fixture.componentInstance.beneficios()).toEqual([
      { id: 1, nome: 'A', descricao: 'desc', valor: 100, ativo: true, version: 0 }
    ]);
    expect(fixture.componentInstance.totalElements()).toBe(1);
    expect(fixture.componentInstance.loading()).toBeFalse();
  });

  it('deve recarregar ao mudar de pagina', () => {
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/api/v1/beneficios`).flush({
      content: [], totalElements: 0, totalPages: 0, number: 0, size: 10
    });

    fixture.componentInstance.onPageChange(2);
    const req = httpMock.expectOne((r) =>
      r.url === `${environment.apiUrl}/api/v1/beneficios` && r.params.get('page') === '2'
    );
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 2, size: 10 });
  });

  it('filtra por busca por nome aplicada localmente', () => {
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/api/v1/beneficios`).flush({
      content: [
        { id: 1, nome: 'Vale alimentacao', descricao: null, valor: 100, ativo: true, version: 0 },
        { id: 2, nome: 'Vale transporte', descricao: null, valor: 50, ativo: true, version: 0 },
        { id: 3, nome: 'Plano de saude', descricao: null, valor: 200, ativo: true, version: 0 }
      ],
      totalElements: 3, totalPages: 1, number: 0, size: 10
    });

    fixture.componentInstance.onSearch('vale');
    expect(fixture.componentInstance.filtrados().length).toBe(2);
    expect(fixture.componentInstance.filtrados()[0].nome).toContain('Vale');
  });

  it('filtra por status', () => {
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/api/v1/beneficios`).flush({
      content: [
        { id: 1, nome: 'A', descricao: null, valor: 100, ativo: true, version: 0 },
        { id: 2, nome: 'B', descricao: null, valor: 50, ativo: false, version: 0 }
      ],
      totalElements: 2, totalPages: 1, number: 0, size: 10
    });

    fixture.componentInstance.onStatusChange('inativos');
    expect(fixture.componentInstance.filtrados().length).toBe(1);
    expect(fixture.componentInstance.filtrados()[0].ativo).toBeFalse();
  });
});
