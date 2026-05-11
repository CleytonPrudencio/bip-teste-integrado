import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PaginationComponent);
  });

  it('totalPages deve calcular a partir de totalElements e size', () => {
    fixture.componentInstance.size = 10;
    fixture.componentInstance.totalElements =25;
    expect(fixture.componentInstance.totalPages()).toBe(3);
  });

  it('rangeStart e rangeEnd refletem pagina atual', () => {
    fixture.componentInstance.pageIndex = 1;
    fixture.componentInstance.size = 10;
    fixture.componentInstance.totalElements =25;
    expect(fixture.componentInstance.rangeStart()).toBe(11);
    expect(fixture.componentInstance.rangeEnd()).toBe(20);
  });

  it('rangeEnd nunca passa de totalElements', () => {
    fixture.componentInstance.pageIndex = 2;
    fixture.componentInstance.size = 10;
    fixture.componentInstance.totalElements =25;
    expect(fixture.componentInstance.rangeEnd()).toBe(25);
  });

  it('goTo emite pageChange e ignora valor igual', () => {
    fixture.componentInstance.size = 10;
    fixture.componentInstance.totalElements =50;
    let emitted: number | undefined;
    fixture.componentInstance.pageChange.subscribe((p: number) => (emitted = p));

    fixture.componentInstance.goTo(2);
    expect(emitted).toBe(2);

    emitted = undefined;
    fixture.componentInstance.goTo(2);
    expect(emitted).toBeUndefined();
  });

  it('goTo clampa nos limites', () => {
    fixture.componentInstance.size = 10;
    fixture.componentInstance.totalElements =30;
    let emitted: number | undefined;
    fixture.componentInstance.pageChange.subscribe((p: number) => (emitted = p));

    fixture.componentInstance.goTo(99);
    expect(emitted).toBe(2);
    fixture.componentInstance.goTo(-5);
    expect(emitted).toBe(0);
  });

  it('changeSize zera pagina e emite ambos eventos', () => {
    fixture.componentInstance.pageIndex = 3;
    fixture.componentInstance.size = 10;
    fixture.componentInstance.totalElements =50;
    let sizeEmitted: number | undefined;
    let pageEmitted: number | undefined;
    fixture.componentInstance.sizeChange.subscribe((s: number) => (sizeEmitted = s));
    fixture.componentInstance.pageChange.subscribe((p: number) => (pageEmitted = p));

    fixture.componentInstance.changeSize(20);
    expect(sizeEmitted).toBe(20);
    expect(pageEmitted).toBe(0);
  });

  it('visiblePages limita janela em 5 paginas centradas', () => {
    fixture.componentInstance.size = 10;
    fixture.componentInstance.totalElements =100;
    fixture.componentInstance.pageIndex = 4;
    const pages = fixture.componentInstance.visiblePages();
    expect(pages.length).toBeLessThanOrEqual(5);
    expect(pages).toContain(4);
  });
});
