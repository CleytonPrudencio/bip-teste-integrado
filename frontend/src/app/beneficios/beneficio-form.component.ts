import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BeneficioService } from '../shared/beneficio.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-beneficio-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="header-row">
      <div>
        <h2>{{ isEdit() ? 'Editar beneficio' : 'Novo beneficio' }}</h2>
        <p class="muted">Preencha os dados abaixo para {{ isEdit() ? 'atualizar' : 'criar' }} um beneficio.</p>
      </div>
      <a class="btn-secondary" routerLink="/beneficios" role="button">Voltar</a>
    </section>

    <form class="card" [formGroup]="form" (ngSubmit)="salvar()">
      <div class="field">
        <label for="nome">Nome *</label>
        <input id="nome" type="text" formControlName="nome" maxlength="100" />
        @if (errorOf('nome'); as err) {
          <div class="field-error">{{ err }}</div>
        }
      </div>

      <div class="field">
        <label for="descricao">Descricao</label>
        <textarea id="descricao" rows="3" formControlName="descricao" maxlength="255"></textarea>
        @if (errorOf('descricao'); as err) {
          <div class="field-error">{{ err }}</div>
        }
      </div>

      <div class="row">
        <div class="field">
          <label for="valor">Valor *</label>
          <input id="valor" type="number" step="0.01" min="0" formControlName="valor" />
          @if (errorOf('valor'); as err) {
            <div class="field-error">{{ err }}</div>
          }
        </div>

        <div class="field">
          <label for="ativo">Status</label>
          <select id="ativo" formControlName="ativo">
            <option [ngValue]="true">Ativo</option>
            <option [ngValue]="false">Inativo</option>
          </select>
        </div>
      </div>

      <div class="actions" style="margin-top: 1rem;">
        <button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">
          @if (saving()) { <span class="spinner"></span> } Salvar
        </button>
        <a class="btn-secondary" routerLink="/beneficios" role="button">Cancelar</a>
      </div>
    </form>
  `,
  styles: [`
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    h2 { margin: 0 0 0.25rem 0; font-size: 1.5rem; }
    .actions { display: flex; gap: 0.5rem; align-items: center; }
  `]
})
export class BeneficioFormComponent implements OnInit {
  private readonly service = inject(BeneficioService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly id = signal<number | null>(null);
  readonly saving = signal<boolean>(false);

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    descricao: ['', [Validators.maxLength(255)]],
    valor: [0, [Validators.required, Validators.min(0)]],
    ativo: [true]
  });

  isEdit(): boolean {
    return this.id() !== null;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const numericId = Number(idParam);
      this.id.set(numericId);
      this.service.get(numericId).subscribe((b) => {
        this.form.patchValue({
          nome: b.nome,
          descricao: b.descricao ?? '',
          valor: b.valor,
          ativo: b.ativo
        });
      });
    }
  }

  errorOf(field: string): string | null {
    const control = this.form.get(field);
    if (!control || !control.touched || control.valid) {
      return null;
    }
    if (control.hasError('required')) return 'Campo obrigatorio';
    if (control.hasError('maxlength')) return 'Tamanho maximo excedido';
    if (control.hasError('min')) return 'Valor deve ser maior ou igual a zero';
    return 'Valor invalido';
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = {
      nome: this.form.value.nome ?? '',
      descricao: this.form.value.descricao || null,
      valor: Number(this.form.value.valor ?? 0),
      ativo: this.form.value.ativo ?? true
    };

    this.saving.set(true);
    const obs = this.isEdit()
      ? this.service.update(this.id() as number, payload)
      : this.service.create(payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.isEdit() ? 'Beneficio atualizado.' : 'Beneficio criado.');
        this.router.navigate(['/beneficios']);
      },
      error: () => this.saving.set(false)
    });
  }
}
