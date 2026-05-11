import { fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  it('deve emitir mensagem e limpa apos duracao', fakeAsync(() => {
    const service = new ToastService();
    service.show('ola', 'success', 1000);
    expect(service.current()?.text).toBe('ola');
    expect(service.current()?.type).toBe('success');
    tick(1000);
    expect(service.current()).toBeNull();
  }));

  it('error deve usar tipo error', () => {
    const service = new ToastService();
    service.error('falhou');
    expect(service.current()?.type).toBe('error');
  });

  it('clear deve limpar mensagem atual', () => {
    const service = new ToastService();
    service.success('algo');
    service.clear();
    expect(service.current()).toBeNull();
  });
});
