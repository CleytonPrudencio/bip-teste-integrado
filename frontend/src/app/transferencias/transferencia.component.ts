import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Beneficio, TransferenciaHistorico, TransferResponse } from '../shared/beneficio.model';
import { BeneficioService } from '../shared/beneficio.service';
import { ToastService } from '../shared/toast.service';
import { CurrencyMaskDirective } from '../shared/currency-mask.directive';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-transferencia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyMaskDirective, IconComponent],
  template: `
    <section class="page-header">
      <div>
        <h2>Transferencia entre beneficios</h2>
        <p class="muted">Transfira valor da origem para o destino com validacao de saldo e locking pessimista.</p>
      </div>
    </section>

    <div class="row" style="align-items: flex-start;">
      <form class="card" [formGroup]="form" (ngSubmit)="executar()" style="flex: 1.2; min-width: 280px;">
        <div class="field">
          <label for="fromId">Origem *</label>
          <select id="fromId" formControlName="fromId">
            <option [ngValue]="null">Selecione...</option>
            @for (b of beneficiosAtivos(); track b.id) {
              <option [ngValue]="b.id">{{ b.nome }} ({{ b.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }})</option>
            }
          </select>
        </div>

        <div class="field">
          <label for="toId">Destino *</label>
          <select id="toId" formControlName="toId">
            <option [ngValue]="null">Selecione...</option>
            @for (b of beneficiosAtivos(); track b.id) {
              <option [ngValue]="b.id" [disabled]="b.id === form.value.fromId">
                {{ b.nome }} ({{ b.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }})
              </option>
            }
          </select>
        </div>

        <div class="field">
          <label for="amount">Valor *</label>
          <div class="input-group">
            <span class="input-prefix">R$</span>
            <input id="amount" type="text" appCurrencyMask formControlName="amount" placeholder="0,00" />
          </div>
          @if (mesmoOrigemDestino()) {
            <div class="field-error">Origem e destino devem ser diferentes.</div>
          }
        </div>

        <div class="actions">
          <button type="submit" class="btn-primary"
                  [disabled]="form.invalid || executando() || mesmoOrigemDestino()">
            @if (executando()) { <span class="spinner"></span> }
            <app-icon name="arrow-left-right"></app-icon>
            Transferir
          </button>
        </div>

        @if (ultimaTransferencia(); as t) {
          <div class="card" style="margin-top: 1rem; background: #f0f9ff; border-color: #bae6fd;">
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">
              <app-icon name="check-circle" [size]="20" style="color: var(--color-success);"></app-icon>
              <strong>Ultima transferencia concluida</strong>
            </div>
            <div class="muted" style="font-size:0.85rem;">
              {{ t.amount | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}
              transferidos. Origem: {{ t.fromValorFinal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }},
              destino: {{ t.toValorFinal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}.
            </div>
          </div>
        }
      </form>

      <section class="card" style="flex: 1; min-width: 280px;">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">
          <app-icon name="history" [size]="18"></app-icon>
          <strong>Historico recente</strong>
        </div>

        @if (carregandoHistorico()) {
          <div style="display:flex;align-items:center;gap:0.5rem;justify-content:center;padding:1.5rem;">
            <span class="spinner"></span> <span class="muted">Carregando...</span>
          </div>
        } @else if (historico().length === 0) {
          <div class="empty-state" style="padding:1.5rem 0;">
            <app-icon name="inbox" [size]="32" class="empty-state-icon"></app-icon>
            <p class="muted" style="margin:0;font-size:0.9rem;">Nenhuma transferencia ainda.</p>
          </div>
        } @else {
          <div class="history-list">
            @for (t of historico(); track t.id) {
              <div class="history-item">
                <div class="history-flow">
                  <span class="history-entity">{{ t.fromNome }}</span>
                  <span class="history-arrow"><app-icon name="arrow-right" [size]="14"></app-icon></span>
                  <span class="history-entity">{{ t.toNome }}</span>
                </div>
                <div style="text-align: right;">
                  <div class="history-amount">{{ t.amount | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</div>
                  <div class="history-time">{{ formatTime(t.executadoEm) }}</div>
                </div>
              </div>
            }
          </div>
        }
      </section>
    </div>
  `
})
export class TransferenciaComponent implements OnInit {
  private readonly service = inject(BeneficioService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly beneficios = signal<Beneficio[]>([]);
  readonly executando = signal<boolean>(false);
  readonly ultimaTransferencia = signal<TransferResponse | null>(null);
  readonly historico = signal<TransferenciaHistorico[]>([]);
  readonly carregandoHistorico = signal<boolean>(false);

  readonly form = this.fb.group({
    fromId: this.fb.control<number | null>(null, Validators.required),
    toId: this.fb.control<number | null>(null, Validators.required),
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)])
  });

  readonly beneficiosAtivos = computed(() => this.beneficios().filter((b) => b.ativo));

  mesmoOrigemDestino(): boolean {
    const { fromId, toId } = this.form.value;
    return fromId !== null && toId !== null && fromId === toId;
  }

  ngOnInit(): void {
    this.carregarBeneficios();
    this.carregarHistorico();
  }

  carregarBeneficios(): void {
    this.service.list(0, 100).subscribe((page) => this.beneficios.set(page.content));
  }

  carregarHistorico(): void {
    this.carregandoHistorico.set(true);
    this.service.historico(0, 10).subscribe({
      next: (page) => {
        this.historico.set(page.content);
        this.carregandoHistorico.set(false);
      },
      error: () => this.carregandoHistorico.set(false)
    });
  }

  formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  }

  executar(): void {
    if (this.form.invalid || this.mesmoOrigemDestino()) {
      this.form.markAllAsTouched();
      return;
    }
    const { fromId, toId, amount } = this.form.value;
    this.executando.set(true);
    this.service
      .transfer({ fromId: fromId as number, toId: toId as number, amount: amount as number })
      .subscribe({
        next: (resp) => {
          this.executando.set(false);
          this.ultimaTransferencia.set(resp);
          this.toast.success('Transferencia concluida com sucesso.');
          this.form.reset();
          this.carregarBeneficios();
          this.carregarHistorico();
        },
        error: () => this.executando.set(false)
      });
  }
}
