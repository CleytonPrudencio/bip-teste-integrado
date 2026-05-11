import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Beneficio, BeneficioStats, TransferenciaHistorico } from '../shared/beneficio.model';
import { BeneficioService } from '../shared/beneficio.service';
import { ToastService } from '../shared/toast.service';
import { ConfirmService } from '../shared/confirm.service';
import { IconComponent } from '../shared/icon.component';
import { PaginationComponent } from '../shared/pagination.component';
import { BalanceChartComponent, BalancePoint } from '../shared/balance-chart.component';

@Component({
  selector: 'app-beneficio-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, PaginationComponent, BalanceChartComponent],
  template: `
    @if (carregando()) {
      <div class="card" style="display:flex;align-items:center;gap:0.6rem;justify-content:center;">
        <span class="spinner"></span> <span class="muted">Carregando detalhes...</span>
      </div>
    } @else if (beneficio() === null) {
      <div class="card empty-state">
        <app-icon name="alert-circle" [size]="48" class="empty-state-icon"></app-icon>
        <p>Beneficio nao encontrado.</p>
        <a class="btn-primary" routerLink="/beneficios">Voltar para lista</a>
      </div>
    }
    @if (beneficio(); as b) {
      <section class="hero-card">
        <div class="hero-main">
          <div class="hero-icon">
            <app-icon name="wallet" [size]="32"></app-icon>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div class="muted" style="font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase;">
              Beneficio #{{ b.id }}
            </div>
            <h2 style="margin: 0.15rem 0 0.35rem;">{{ b.nome }}</h2>
            <p class="muted" style="margin: 0;">{{ b.descricao || 'Sem descricao cadastrada.' }}</p>
          </div>
          <div style="text-align: right;">
            <div class="muted" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em;">
              Saldo atual
            </div>
            <div class="hero-balance">{{ b.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
            @if (b.ativo) {
              <span class="badge badge-success">Ativo</span>
            } @else {
              <span class="badge badge-muted">Inativo</span>
            }
          </div>
        </div>

        <div class="hero-meta">
          <div>
            <span class="muted" style="font-size: 0.78rem;">Versao (optimistic lock)</span>
            <strong>v{{ b.version }}</strong>
          </div>
          <div>
            <span class="muted" style="font-size: 0.78rem;">ID</span>
            <strong>{{ b.id }}</strong>
          </div>
        </div>

        <div class="hero-actions">
          <a class="btn-secondary" routerLink="/beneficios">
            <app-icon name="arrow-right" [size]="14" style="transform: rotate(180deg);"></app-icon>
            Voltar
          </a>
          <a class="btn-secondary" [routerLink]="['/beneficios', b.id, 'editar']">
            <app-icon name="edit"></app-icon>
            Editar
          </a>
          <a class="btn-primary" routerLink="/transferencias" [queryParams]="{ fromId: b.id }">
            <app-icon name="arrow-left-right"></app-icon>
            Nova transferencia
          </a>
          <button type="button" class="btn-danger" (click)="excluir(b)">
            <app-icon name="trash"></app-icon>
            Excluir
          </button>
        </div>
      </section>

      @if (stats(); as s) {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon stat-icon-green"><app-icon name="arrow-right" [size]="22"></app-icon></div>
            <div class="stat-content">
              <div class="stat-label">Total recebido</div>
              <div class="stat-value">{{ s.totalRecebido | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-amber"><app-icon name="arrow-right" [size]="22" style="transform: rotate(180deg);"></app-icon></div>
            <div class="stat-content">
              <div class="stat-label">Total enviado</div>
              <div class="stat-value">{{ s.totalEnviado | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" [class.stat-icon-blue]="s.saldoLiquido >= 0"
                                   [class.stat-icon-amber]="s.saldoLiquido < 0">
              <app-icon name="banknote" [size]="22"></app-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">Saldo liquido (rec - env)</div>
              <div class="stat-value"
                   [style.color]="s.saldoLiquido >= 0 ? 'var(--color-success)' : 'var(--color-danger)'">
                {{ s.saldoLiquido | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-violet"><app-icon name="activity" [size]="22"></app-icon></div>
            <div class="stat-content">
              <div class="stat-label">Total de movimentacoes</div>
              <div class="stat-value">{{ s.totalTransferencias }}</div>
            </div>
          </div>
        </div>
      }

      <section class="card" style="margin-bottom: 1rem;">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">
          <app-icon name="activity" [size]="18"></app-icon>
          <strong>Evolucao do saldo</strong>
          <span class="muted" style="font-size: 0.8rem;">
            (computada a partir do historico de transferencias)
          </span>
        </div>
        <app-balance-chart [points]="balancePoints()"></app-balance-chart>
      </section>

      <section class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;margin-bottom:0.75rem;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <app-icon name="history" [size]="18"></app-icon>
            <strong>Historico de transferencias deste beneficio</strong>
          </div>
        </div>

        @if (carregandoHistorico()) {
          <div style="display:flex;align-items:center;gap:0.5rem;justify-content:center;padding:1.5rem;">
            <span class="spinner"></span> <span class="muted">Carregando historico...</span>
          </div>
        } @else if (historico().length === 0) {
          <div class="empty-state" style="padding: 1.5rem 0;">
            <app-icon name="inbox" [size]="32" class="empty-state-icon"></app-icon>
            <p class="muted" style="margin:0;font-size:0.9rem;">
              Esse beneficio ainda nao participou de nenhuma transferencia.
            </p>
          </div>
        } @else {
          <div class="history-list">
            @for (t of historico(); track t.id) {
              <div class="history-item">
                <span class="badge"
                      [class.badge-success]="t.toId === beneficio()?.id"
                      [class.badge-muted]="t.toId !== beneficio()?.id"
                      style="min-width: 70px; text-align: center;">
                  {{ t.toId === beneficio()?.id ? 'Entrada' : 'Saida' }}
                </span>
                <div class="history-flow">
                  <span class="history-entity">{{ t.fromNome }}</span>
                  <span class="history-arrow"><app-icon name="arrow-right" [size]="14"></app-icon></span>
                  <span class="history-entity">{{ t.toNome }}</span>
                </div>
                <div style="text-align: right;">
                  <div class="history-amount"
                       [style.color]="t.toId === beneficio()?.id ? 'var(--color-success)' : 'var(--color-danger)'">
                    {{ t.toId === beneficio()?.id ? '+ ' : '- ' }}{{ t.amount | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
                  </div>
                  <div class="history-time">{{ formatTime(t.executadoEm) }}</div>
                </div>
              </div>
            }
          </div>

          <app-pagination
            [pageIndex]="pageIndex()"
            [size]="pageSize()"
            [totalElements]="totalHistorico()"
            (pageChange)="onPageChange($event)"
            (sizeChange)="onSizeChange($event)">
          </app-pagination>
        }
      </section>
    }
  `,
  styles: [`
    .hero-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 60%);
      border: 1px solid var(--color-border);
      border-radius: 14px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .hero-main {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .hero-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: var(--color-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.25);
    }
    .hero-balance {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--color-text);
      line-height: 1;
      margin: 0.2rem 0 0.4rem;
    }
    .hero-meta {
      display: flex;
      gap: 1.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
      flex-wrap: wrap;
    }
    .hero-meta > div {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .hero-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }
  `]
})
export class BeneficioDetailComponent implements OnInit {
  private readonly service = inject(BeneficioService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly beneficio = signal<Beneficio | null>(null);
  readonly stats = signal<BeneficioStats | null>(null);
  readonly historico = signal<TransferenciaHistorico[]>([]);
  readonly totalHistorico = signal<number>(0);
  readonly carregando = signal<boolean>(true);
  readonly carregandoHistorico = signal<boolean>(false);
  readonly pageIndex = signal<number>(0);
  readonly pageSize = signal<number>(10);

  readonly balancePoints = computed<BalancePoint[]>(() => {
    const b = this.beneficio();
    if (!b) return [];
    const sorted = [...this.historico()].sort(
      (a, c) => new Date(a.executadoEm).getTime() - new Date(c.executadoEm).getTime()
    );
    return sorted.map((t) => ({
      date: new Date(t.executadoEm),
      balance: t.toId === b.id ? Number(t.toValorFinal) : Number(t.fromValorFinal)
    }));
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        const id = Number(idParam);
        this.pageIndex.set(0);
        this.carregarTudo(id);
      }
    });
  }

  carregarTudo(id: number): void {
    this.carregando.set(true);
    this.service.get(id).subscribe({
      next: (b) => {
        this.beneficio.set(b);
        this.carregando.set(false);
        this.carregarStats(id);
        this.carregarHistorico(id);
      },
      error: () => {
        this.beneficio.set(null);
        this.carregando.set(false);
      }
    });
  }

  carregarStats(id: number): void {
    this.service.stats(id).subscribe({
      next: (s) => this.stats.set(s)
    });
  }

  carregarHistorico(id: number): void {
    this.carregandoHistorico.set(true);
    this.service.historico({ page: this.pageIndex(), size: this.pageSize(), beneficioId: id }).subscribe({
      next: (page) => {
        this.historico.set(page.content);
        this.totalHistorico.set(page.totalElements);
        this.carregandoHistorico.set(false);
      },
      error: () => this.carregandoHistorico.set(false)
    });
  }

  onPageChange(page: number): void {
    const b = this.beneficio();
    if (!b) return;
    this.pageIndex.set(page);
    this.carregarHistorico(b.id);
  }

  onSizeChange(size: number): void {
    const b = this.beneficio();
    if (!b) return;
    this.pageSize.set(size);
    this.pageIndex.set(0);
    this.carregarHistorico(b.id);
  }

  formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  }

  async excluir(b: Beneficio): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Excluir beneficio',
      message: `Excluir "${b.nome}"? Essa acao nao pode ser desfeita.`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      danger: true
    });
    if (!ok) return;
    this.service.delete(b.id).subscribe(() => {
      this.toast.success(`Beneficio "${b.nome}" removido.`);
      this.router.navigate(['/beneficios']);
    });
  }
}
