import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Beneficio } from '../shared/beneficio.model';
import { BeneficioService } from '../shared/beneficio.service';
import { ToastService } from '../shared/toast.service';
import { ConfirmService } from '../shared/confirm.service';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-beneficio-list',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue"><app-icon name="wallet" [size]="22"></app-icon></div>
        <div class="stat-content">
          <div class="stat-label">Total de beneficios</div>
          <div class="stat-value">{{ beneficios().length }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-green"><app-icon name="check-circle" [size]="22"></app-icon></div>
        <div class="stat-content">
          <div class="stat-label">Ativos</div>
          <div class="stat-value">{{ totalAtivos() }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-violet"><app-icon name="banknote" [size]="22"></app-icon></div>
        <div class="stat-content">
          <div class="stat-label">Saldo total</div>
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
        <p class="muted">Gerencie os beneficios disponiveis e seus saldos.</p>
      </div>
      <a class="btn-primary" routerLink="/beneficios/novo">
        <app-icon name="plus"></app-icon>
        Novo beneficio
      </a>
    </section>

    @if (loading()) {
      <div class="card" style="display:flex;align-items:center;gap:0.6rem;justify-content:center;">
        <span class="spinner"></span> <span class="muted">Carregando...</span>
      </div>
    } @else if (beneficios().length === 0) {
      <div class="card empty-state">
        <app-icon name="inbox" [size]="48" class="empty-state-icon"></app-icon>
        <p style="margin: 0 0 1rem;">Nenhum beneficio cadastrado ainda.</p>
        <a class="btn-primary" routerLink="/beneficios/novo">
          <app-icon name="plus"></app-icon>
          Cadastrar o primeiro
        </a>
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
          @for (b of beneficios(); track b.id) {
            <tr>
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
              <td class="actions">
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
    }
  `,
  styles: [`
    .actions-col { width: 1%; white-space: nowrap; }
  `]
})
export class BeneficioListComponent implements OnInit {
  private readonly service = inject(BeneficioService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly beneficios = signal<Beneficio[]>([]);
  readonly loading = signal<boolean>(false);

  readonly totalAtivos = computed(() => this.beneficios().filter((b) => b.ativo).length);
  readonly saldoTotal = computed(() =>
    this.beneficios().reduce((acc, b) => acc + Number(b.valor || 0), 0)
  );
  readonly maiorSaldo = computed(() =>
    this.beneficios().reduce((max, b) => Math.max(max, Number(b.valor || 0)), 0)
  );

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.service.list(0, 100).subscribe({
      next: (page) => {
        this.beneficios.set(page.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
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
        this.beneficios.update((lista) => lista.filter((x) => x.id !== b.id));
      }
    });
  }
}
