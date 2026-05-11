import { Directive, ElementRef, HostListener, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const MAX_DIGITS = 15;

@Directive({
  selector: 'input[appCurrencyMask]',
  standalone: true,
  host: {
    '[attr.inputmode]': '"decimal"',
    '[attr.autocomplete]': '"off"',
    type: 'text'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyMaskDirective),
      multi: true
    }
  ]
})
export class CurrencyMaskDirective implements ControlValueAccessor {
  private readonly el = inject(ElementRef<HTMLInputElement>);

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number | null | undefined | string): void {
    const input = this.el.nativeElement;
    if (value === null || value === undefined || value === '') {
      input.value = '';
      return;
    }
    const numeric = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(numeric) || numeric === 0) {
      input.value = '';
      return;
    }
    input.value = this.format(numeric);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.el.nativeElement.disabled = disabled;
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    this.processInput(event.target as HTMLInputElement);
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const input = this.el.nativeElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, start) + pasted + input.value.slice(end);
    this.processInput(input);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  private processInput(input: HTMLInputElement): void {
    const raw = (input.value || '').replace(/\D/g, '').slice(0, MAX_DIGITS);
    if (!raw) {
      input.value = '';
      this.onChange(null);
      return;
    }
    const numeric = Number(raw) / 100;
    input.value = this.format(numeric);
    input.setSelectionRange(input.value.length, input.value.length);
    this.onChange(numeric);
  }

  private format(value: number): string {
    const fixed = Math.abs(value).toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    const intWithSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const sign = value < 0 ? '-' : '';
    return `${sign}${intWithSep},${decPart}`;
  }
}
