import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly current = signal<ToastMessage | null>(null);

  show(text: string, type: ToastType = 'success', durationMs = 3500): void {
    const message: ToastMessage = { id: this.nextId++, type, text };
    this.current.set(message);
    setTimeout(() => {
      if (this.current()?.id === message.id) {
        this.current.set(null);
      }
    }, durationMs);
  }

  success(text: string): void {
    this.show(text, 'success');
  }

  error(text: string): void {
    this.show(text, 'error', 5000);
  }

  warning(text: string): void {
    this.show(text, 'warning', 4500);
  }

  clear(): void {
    this.current.set(null);
  }
}
