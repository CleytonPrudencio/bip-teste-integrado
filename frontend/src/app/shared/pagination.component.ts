import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagination">
      <div class="pagination-info">
        @if (total() > 0) {
          Mostrando {{ rangeStart() }}–{{ rangeEnd() }} de {{ total() }}
        } @else {
          Nenhum registro
        }
      </div>

      <div class="pagination-controls">
        <label class="pagination-size">
          Itens por pagina:
          <select [ngModel]="pageSize()" (ngModelChange)="changeSize($event)">
            @for (s of sizeOptions; track s) {
              <option [ngValue]="s">{{ s }}</option>
            }
          </select>
        </label>

        <div class="pagination-buttons">
          <button type="button" class="btn-secondary btn-sm" (click)="goTo(0)"
                  [disabled]="page() === 0" aria-label="Primeira pagina">«</button>
          <button type="button" class="btn-secondary btn-sm" (click)="goTo(page() - 1)"
                  [disabled]="page() === 0" aria-label="Pagina anterior">‹</button>

          @for (p of visiblePages(); track p) {
            <button type="button"
                    class="btn-sm"
                    [class.btn-primary]="p === page()"
                    [class.btn-secondary]="p !== page()"
                    (click)="goTo(p)">
              {{ p + 1 }}
            </button>
          }

          <button type="button" class="btn-secondary btn-sm" (click)="goTo(page() + 1)"
                  [disabled]="page() >= totalPages() - 1" aria-label="Proxima pagina">›</button>
          <button type="button" class="btn-secondary btn-sm" (click)="goTo(totalPages() - 1)"
                  [disabled]="page() >= totalPages() - 1" aria-label="Ultima pagina">»</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
      padding: 0.75rem;
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
    }
    .pagination-info {
      font-size: 0.85rem;
      color: var(--color-muted);
    }
    .pagination-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .pagination-size {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: var(--color-muted);
      margin: 0;
    }
    .pagination-size select {
      width: auto;
      padding: 0.3rem 0.5rem;
      font-size: 0.85rem;
    }
    .pagination-buttons {
      display: flex;
      gap: 0.25rem;
    }
    .pagination-buttons button {
      min-width: 32px;
      padding: 0.3rem 0.55rem;
    }
  `]
})
export class PaginationComponent {
  private readonly internalPage = signal(0);
  private readonly internalSize = signal(10);
  private readonly internalTotal = signal(0);

  readonly sizeOptions = [5, 10, 20, 50];

  @Input() set pageIndex(value: number) {
    this.internalPage.set(value ?? 0);
  }

  @Input() set size(value: number) {
    this.internalSize.set(value ?? 10);
  }

  @Input() set totalElements(value: number) {
    this.internalTotal.set(value ?? 0);
  }

  @Output() pageChange = new EventEmitter<number>();
  @Output() sizeChange = new EventEmitter<number>();

  readonly page = this.internalPage.asReadonly();
  readonly pageSize = this.internalSize.asReadonly();
  readonly total = this.internalTotal.asReadonly();

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.internalTotal() / this.internalSize()))
  );

  readonly rangeStart = computed(() => this.internalPage() * this.internalSize() + 1);

  readonly rangeEnd = computed(() =>
    Math.min((this.internalPage() + 1) * this.internalSize(), this.internalTotal())
  );

  visiblePages = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.internalPage();
    const max = 5;
    let start = Math.max(0, current - Math.floor(max / 2));
    const end = Math.min(total, start + max);
    start = Math.max(0, end - max);
    const pages: number[] = [];
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  });

  goTo(target: number): void {
    const clamped = Math.max(0, Math.min(this.totalPages() - 1, target));
    if (clamped !== this.internalPage()) {
      this.internalPage.set(clamped);
      this.pageChange.emit(clamped);
    }
  }

  changeSize(value: number): void {
    if (value !== this.internalSize()) {
      this.internalSize.set(value);
      this.internalPage.set(0);
      this.sizeChange.emit(value);
      this.pageChange.emit(0);
    }
  }
}
