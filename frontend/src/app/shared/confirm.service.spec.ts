import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  it('ask deve guardar estado e resolver promise com true ao confirmar', async () => {
    const service = new ConfirmService();
    const promise = service.ask({ title: 'T', message: 'M' });
    expect(service.current()?.title).toBe('T');
    expect(service.current()?.confirmLabel).toBe('Confirmar');
    service.close(true);
    await expectAsync(promise).toBeResolvedTo(true);
    expect(service.current()).toBeNull();
  });

  it('ask deve resolver com false ao cancelar', async () => {
    const service = new ConfirmService();
    const promise = service.ask({ title: 'T', message: 'M', danger: true });
    service.close(false);
    await expectAsync(promise).toBeResolvedTo(false);
  });

  it('ask deve usar labels customizados quando fornecidos', () => {
    const service = new ConfirmService();
    service.ask({ title: 't', message: 'm', confirmLabel: 'Sim', cancelLabel: 'Nao' });
    expect(service.current()?.confirmLabel).toBe('Sim');
    expect(service.current()?.cancelLabel).toBe('Nao');
    service.close(false);
  });
});
