import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from './confirm.service';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (confirm.current(); as state) {
      <div class="modal-backdrop" (click)="cancel($event)">
        <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <h3>{{ state.title }}</h3>
          <p>{{ state.message }}</p>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="onClose(false)">
              {{ state.cancelLabel }}
            </button>
            <button type="button"
                    [class]="state.danger ? 'btn-danger' : 'btn-primary'"
                    (click)="onClose(true)"
                    cdkFocusInitial>
              {{ state.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmComponent {
  readonly confirm = inject(ConfirmService);

  onClose(ok: boolean): void {
    this.confirm.close(ok);
  }

  cancel(event: MouseEvent): void {
    event.stopPropagation();
    this.confirm.close(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirm.current()) {
      this.confirm.close(false);
    }
  }
}
