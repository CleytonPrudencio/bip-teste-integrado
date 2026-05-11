import { Injectable, signal } from '@angular/core';

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends Required<ConfirmConfig> {
  resolve: (ok: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly current = signal<ConfirmState | null>(null);

  ask(config: ConfirmConfig): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.current.set({
        title: config.title,
        message: config.message,
        confirmLabel: config.confirmLabel ?? 'Confirmar',
        cancelLabel: config.cancelLabel ?? 'Cancelar',
        danger: config.danger ?? false,
        resolve
      });
    });
  }

  close(ok: boolean): void {
    const state = this.current();
    if (state) {
      state.resolve(ok);
      this.current.set(null);
    }
  }
}
