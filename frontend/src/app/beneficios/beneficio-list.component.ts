import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Beneficio } from '../shared/beneficio.model';
import { BeneficioService } from '../shared/beneficio.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-beneficio-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="header-row">
      <div>
        <h2>Beneficios</h2>
        <p class="muted">Gerencie os beneficios disponiveis e seus saldos.</p>
      </div>
      <a class="btn-primary" routerLink="/beneficios/novo" role="button" aria-label="Novo beneficio">
        Novo beneficio
      </a>
    </section>

    @if (loading()) {
      <div class="card center"><span class="spinner"></span> <span class="muted">Carregando...</span></div>
    } @else if (beneficios().length === 0) {
      <div class="card empty-state">
        Nenhum beneficio cadastrado.
        <div style="margin-top: 0.75rem;">
          <a class="btn-primary" routerLink="/beneficios/novo" role="button">Cadastrar o primeiro</a>
        </div>
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
              <td>{{ b.nome }}</td>
              <td class="muted">{{ b.descricao || '-' }}</td>
              <td>{{ b.valor | currency:'BRL':'symbol':'1.2-2':'pt-BR' }}</td>
              <td>
                @if (b.ativo) {
                  <span class="badge badge-success">Ativo</span>
                } @else {
                  <span class="badge badge-muted">Inativo</span>
                }
              </td>
              <td class="actions">
                <a class="btn-secondary" [routerLink]="['/beneficios', b.id, 'editar']" role="button">Editar</a>
                <button class="btn-danger" type="button" (click)="remover(b)">Excluir</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
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
    .actions-col { width: 1%; white-space: nowrap; }
    .center { display: flex; align-items: center; gap: 0.5rem; justify-content: center; }
  `]
})
export class BeneficioListComponent implements OnInit {
  private readonly service = inject(BeneficioService);
  private readonly toast = inject(ToastService);

  readonly beneficios = signal<Beneficio[]>([]);
  readonly loading = signal<boolean>(false);

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

  remover(b: Beneficio): void {
    if (!confirm(`Excluir o beneficio "${b.nome}"?`)) {
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
