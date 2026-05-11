import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Beneficio } from '../shared/beneficio.model';
import { BeneficioService } from '../shared/beneficio.service';
import { ToastService } from '../shared/toast.service';
import { ConfirmService } from '../shared/confirm.service';
import { IconComponent } from '../shared/icon.component';
import { PaginationComponent } from '../shared/pagination.component';

@Component({
  selector: 'app-beneficio-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, PaginationComponent],
  template: `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue"><app-icon name="wallet" [size]="22"></app-icon></div>
        <div class="stat-content">
          <div class="stat-label">Total de beneficios</div>
          <div class="stat-value">{{ totalElements() }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-green"><app-icon name="check-circle" [size]="22"></app-icon></div>
        <div class="stat-content">
          <div class="stat-label">Ativos nesta pagina</div>
          <div class="stat-value">{{ totalAtivos() }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-violet"><app-icon name="banknote" [size]="22"></app-icon></div>
        <div class="stat-content">
          <div class="stat-label">Saldo da pagina</div>
          <div class="stat-value">{{ saldoTotal() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-amber"><app-icon name="activity" [size]="22"></app-icon></div>
        <div class="stat-content">
          <div class="stat-label">Maior saldo</div>
          <div class="stat-value">{{ maiorSaldo() | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
        </div>
      </div>
    </div>

    <section class="page-header">
      <div>
        <h2>Beneficios</h2>
        <p class="muted">Clique em qualquer linha para ver detalhes completos do beneficio.</p>
      </div>
      <a class="btn-primary" routerLink="/beneficios/novo">
        <app-icon name="plus"></app-icon>
        Novo beneficio
      </a>
    </section>

    <div class="card" style="margin-bottom: 1rem;">
      <div class="row" style="gap: 0.75rem; align-items: end; margin: 0;">
        <div class="field" style="margin: 0;">
          <label for="search">Buscar por nome</label>
          <input id="search" type="text" [ngModel]="search()" (ngModelChange)="onSearch($event)"
                 placeholder="Digite parte do nome do beneficio..." />
        </div>
        <div class="field" style="margin: 0; flex: 0 0 200px;">
          <label for="statusFilter">Status</label>
          <select id="statusFilter" [ngModel]="statusFilter()" (ngModelChange)="onStatusChange($event)">
            <option value="todos">Todos</option>
            <option value="ativos">Apenas ativos</option>
            <option value="inativos">Apenas inativos</option>
          </select>
        </div>
      </div>
    </div>

    @if (loading()) {
      <div class="card" style="display:flex;align-items:center;gap:0.6rem;justify-content:center;">
        <span class="spinner"></span> <span class="muted">Carregando...</span>
      </div>
    } @else if (filtrados().length === 0) {
      <div class="card empty-state">
        <app-icon name="inbox" [size]="48" class="empty-state-icon"></app-icon>
        <p style="margin: 0 0 1rem;">
          @if (search() || statusFilter() !== 'todos') {
            Nenhum beneficio encontrado para os filtros aplicados.
          } @else {
            Nenhum beneficio cadastrado ainda.
          }
        </p>
        @if (!search() && statusFilter() === 'todos') {
          <a class="btn-primary" routerLink="/beneficios/novo">
            <app-icon name="plus"></app-icon>
            Cadastrar o primeiro
          </a>
        }
      </div>
    } @else {
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Descricao</th>
            <th>Valor</th>
            <th>Status</th>
            <th class="actions-col">Acoes</th>
          </tr>
        </thead>
        <tbody>
          @for (b of filtrados(); track b.id) {
            <tr class="clickable-row" (click)="abrirDetalhe(b)">
              <td>{{ b.id }}</td>
              <td><strong>{{ b.nome }}</strong></td>
              <td class="muted">{{ b.descricao || '-' }}</td>
              <td><strong>{{ b.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</strong></td>
              <td>
                @if (b.ativo) {
                  <span class="badge badge-success">Ativo</span>
                } @else {
                  <span class="badge badge-muted">Inativo</span>
                }
              </td>
              <td class="actions" (click)="$event.stopPropagation()">
                <a class="btn-secondary btn-sm" [routerLink]="['/beneficios', b.id, 'editar']">
                  <app-icon name="edit"></app-icon>
                  Editar
                </a>
                <button class="btn-danger btn-sm" type="button" (click)="remover(b)">
                  <app-icon name="trash"></app-icon>
                  Excluir
                </button>
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
  `,
  styles: [`
    .actions-col { width: 1%; white-space: nowrap; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background-color: #f8fafc; }
  `]
})
export class BeneficioListComponent implements OnInit {
  private readonly service = inject(BeneficioService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);

  readonly beneficios = signal<Beneficio[]>([]);
  readonly loading = signal<boolean>(false);
  readonly pageIndex = signal<number>(0);
  readonly pageSize = signal<number>(10);
  readonly totalElements = signal<number>(0);
  readonly search = signal<string>('');
  readonly statusFilter = signal<'todos' | 'ativos' | 'inativos'>('todos');

  readonly filtrados = computed(() => {
    const q = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return this.beneficios().filter((b) => {
      if (q && !b.nome.toLowerCase().includes(q)) {
        return false;
      }
      if (status === 'ativos' && !b.ativo) return false;
      if (status === 'inativos' && b.ativo) return false;
      return true;
    });
  });

  readonly totalAtivos = computed(() => this.filtrados().filter((b) => b.ativo).length);
  readonly saldoTotal = computed(() =>
    this.filtrados().reduce((acc, b) => acc + Number(b.valor || 0), 0)
  );
  readonly maiorSaldo = computed(() =>
    this.filtrados().reduce((max, b) => Math.max(max, Number(b.valor || 0)), 0)
  );

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.service.list(this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.beneficios.set(page.content);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
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

  onSearch(value: string): void {
    this.search.set(value);
  }

  onStatusChange(value: 'todos' | 'ativos' | 'inativos'): void {
    this.statusFilter.set(value);
  }

  abrirDetalhe(b: Beneficio): void {
    this.router.navigate(['/beneficios', b.id]);
  }

  async remover(b: Beneficio): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Excluir beneficio',
      message: `Tem certeza que deseja excluir "${b.nome}"? Essa acao nao pode ser desfeita.`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      danger: true
    });
    if (!ok) {
      return;
    }
    this.service.delete(b.id).subscribe({
      next: () => {
        this.toast.success(`Beneficio "${b.nome}" removido.`);
        this.carregar();
      }
    });
  }
}
