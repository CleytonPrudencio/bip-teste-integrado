import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (toast.current(); as msg) {
      <div class="toast" [class.toast-success]="msg.type === 'success'"
                          [class.toast-error]="msg.type === 'error'"
                          [class.toast-warning]="msg.type === 'warning'"
           role="status" aria-live="polite">
        {{ msg.text }}
      </div>
    }
  `
})
export class ToastComponent {
  readonly toast = inject(ToastService);
}
