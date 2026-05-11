import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { CurrencyMaskDirective } from './currency-mask.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyMaskDirective],
  template: `<input type="text" appCurrencyMask [formControl]="control" />`
})
class HostComponent {
  control = new FormControl<number | null>(null);
}

describe('CurrencyMaskDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let input: HTMLInputElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  });

  function type(value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('formata digitos como moeda BRL com duas casas', () => {
    type('123456');
    expect(input.value).toBe('1.234,56');
    expect(fixture.componentInstance.control.value).toBe(1234.56);
  });

  it('aceita entrada parcial mantendo conversao correta', () => {
    type('5');
    expect(input.value).toBe('0,05');
    expect(fixture.componentInstance.control.value).toBe(0.05);
  });

  it('limpa quando entrada vazia', () => {
    type('');
    expect(input.value).toBe('');
    expect(fixture.componentInstance.control.value).toBeNull();
  });

  it('ignora caracteres nao numericos', () => {
    type('abc12,34xyz');
    expect(input.value).toBe('12,34');
  });
});
