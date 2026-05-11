import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Beneficio, TransferenciaHistorico } from '../shared/beneficio.model';
import { BeneficioService } from '../shared/beneficio.service';
import { IconComponent } from '../shared/icon.component';
import { PaginationComponent } from '../shared/pagination.component';

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, PaginationComponent],
  template: `
    <section class="page-header">
      <div>
        <h2>Historico de transferencias</h2>
        <p class="muted">Filtre por beneficio envolvido e navegue paginas para auditoria completa.</p>
      </div>
      <a class="btn-primary" routerLink="/transferencias">
        <app-icon name="arrow-left-right"></app-icon>
        Nova transferencia
      </a>
    </section>

    <div class="card" style="margin-bottom: 1rem;">
      <div class="row" style="margin: 0; gap: 0.75rem; align-items: end;">
        <div class="field" style="margin: 0;">
          <label for="filtroBeneficio">Filtrar por beneficio envolvido</label>
          <select id="filtroBeneficio" [ngModel]="beneficioId()" (ngModelChange)="aplicarFiltro($event)">
            <option [ngValue]="null">Todos os beneficios</option>
            @for (b of beneficios(); track b.id) {
              <option [ngValue]="b.id">#{{ b.id }} — {{ b.nome }}</option>
            }
          </select>
        </div>
        <div style="flex: 0 0 auto;">
          <button type="button" class="btn-secondary" (click)="limparFiltro()" [disabled]="beneficioId() === null">
            Limpar filtro
          </button>
        </div>
      </div>
    </div>

    <section class="card">
      @if (carregando()) {
        <div style="display:flex;align-items:center;gap:0.6rem;justify-content:center;padding:1.5rem;">
          <span class="spinner"></span> <span class="muted">Carregando...</span>
        </div>
      } @else if (transferencias().length === 0) {
        <div class="empty-state" style="padding: 2rem 0;">
          <app-icon name="inbox" [size]="48" class="empty-state-icon"></app-icon>
          <p class="muted" style="margin:0 0 1rem;">
            @if (beneficioId() !== null) {
              Esse beneficio nao tem transferencias registradas ainda.
            } @else {
              Nenhuma transferencia registrada no sistema ainda.
            }
          </p>
        </div>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Quando</th>
              <th>De</th>
              <th>Para</th>
              <th style="text-align: right;">Valor</th>
              <th style="text-align: right;">Saldo final origem</th>
              <th style="text-align: right;">Saldo final destino</th>
            </tr>
          </thead>
          <tbody>
            @for (t of transferencias(); track t.id) {
              <tr>
                <td>
                  <div>{{ formatDate(t.executadoEm) }}</div>
                  <div class="muted" style="font-size: 0.78rem;">{{ formatTime(t.executadoEm) }}</div>
                </td>
                <td>
                  <a [routerLink]="['/beneficios', t.fromId]"
                     style="font-weight: 500; color: var(--color-text);">{{ t.fromNome }}</a>
                  <div class="muted" style="font-size: 0.78rem;">#{{ t.fromId }}</div>
                </td>
                <td>
                  <a [routerLink]="['/beneficios', t.toId]"
                     style="font-weight: 500; color: var(--color-text);">{{ t.toNome }}</a>
                  <div class="muted" style="font-size: 0.78rem;">#{{ t.toId }}</div>
                </td>
                <td style="text-align: right;">
                  <strong style="color: var(--color-primary);">
                    {{ t.amount | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                  </strong>
                </td>
                <td style="text-align: right;" class="muted">
                  {{ t.fromValorFinal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                </td>
                <td style="text-align: right;" class="muted">
                  {{ t.toValorFinal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                </td>
              </tr>
            }
          </tbody>
        </table>

        <app-pagination
          [pageIndex]="pageIndex()"
          [size]="pageSize()"
          [totalElements]="totalElements()"
          (pageChange)="onPageChange($event)"
          (sizeChange)="onSizeChange($event)">
        </app-pagination>
      }
    </section>
  `
})
export class HistoricoComponent implements OnInit {
  private readonly service = inject(BeneficioService);

  readonly beneficios = signal<Beneficio[]>([]);
  readonly transferencias = signal<TransferenciaHistorico[]>([]);
  readonly totalElements = signal<number>(0);
  readonly carregando = signal<boolean>(false);
  readonly beneficioId = signal<number | null>(null);
  readonly pageIndex = signal<number>(0);
  readonly pageSize = signal<number>(20);

  ngOnInit(): void {
    this.carregarBeneficios();
    this.carregar();
  }

  carregarBeneficios(): void {
    this.service.list(0, 200).subscribe((p) => this.beneficios.set(p.content));
  }

  carregar(): void {
    this.carregando.set(true);
    this.service.historico({
      page: this.pageIndex(),
      size: this.pageSize(),
      beneficioId: this.beneficioId()
    }).subscribe({
      next: (page) => {
        this.transferencias.set(page.content);
        this.totalElements.set(page.totalElements);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false)
    });
  }

  aplicarFiltro(id: number | null): void {
    this.beneficioId.set(id);
    this.pageIndex.set(0);
    this.carregar();
  }

  limparFiltro(): void {
    this.aplicarFiltro(null);
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page);
    this.carregar();
  }

  onSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(0);
    this.carregar();
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('pt-BR');
    } catch {
      return iso;
    }
  }

  formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  }
}
