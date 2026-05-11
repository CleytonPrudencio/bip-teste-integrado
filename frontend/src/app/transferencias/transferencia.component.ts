import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Beneficio, TransferResponse } from '../shared/beneficio.model';
import { BeneficioService } from '../shared/beneficio.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-transferencia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="header-row">
      <div>
        <h2>Transferencia entre beneficios</h2>
        <p class="muted">Transfira valor da origem para o destino com validacao de saldo e locking.</p>
      </div>
    </section>

    <form class="card" [formGroup]="form" (ngSubmit)="executar()">
      <div class="row">
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
      </div>

      <div class="field">
        <label for="amount">Valor *</label>
        <input id="amount" type="number" step="0.01" min="0.01" formControlName="amount" />
        @if (mesmoOrigemDestino()) {
          <div class="field-error">Origem e destino devem ser diferentes.</div>
        }
      </div>

      <div class="actions">
        <button type="submit" class="btn-primary"
                [disabled]="form.invalid || executando() || mesmoOrigemDestino()">
          @if (executando()) { <span class="spinner"></span> } Transferir
        </button>
      </div>
    </form>

    @if (ultimaTransferencia(); as t) {
      <section class="card resultado">
        <h3>Ultima transferencia</h3>
        <ul>
          <li><strong>Origem:</strong> {{ t.fromId }} — saldo final {{ t.fromValorFinal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</li>
          <li><strong>Destino:</strong> {{ t.toId }} — saldo final {{ t.toValorFinal | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</li>
          <li><strong>Valor transferido:</strong> {{ t.amount | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</li>
          <li><strong>Executado em:</strong> {{ t.executadoEm | date:'short' }}</li>
        </ul>
      </section>
    }
  `,
  styles: [`
    .header-row { margin-bottom: 1.5rem; }
    h2 { margin: 0 0 0.25rem 0; font-size: 1.5rem; }
    h3 { margin: 0 0 0.5rem 0; font-size: 1rem; }
    .resultado { margin-top: 1rem; }
    .resultado ul { margin: 0; padding-left: 1.2rem; }
    .resultado li { padding: 0.15rem 0; }
  `]
})
export class TransferenciaComponent implements OnInit {
  private readonly service = inject(BeneficioService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly beneficios = signal<Beneficio[]>([]);
  readonly executando = signal<boolean>(false);
  readonly ultimaTransferencia = signal<TransferResponse | null>(null);

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
  }

  carregarBeneficios(): void {
    this.service.list(0, 100).subscribe((page) => this.beneficios.set(page.content));
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
        },
        error: () => this.executando.set(false)
      });
  }
}
