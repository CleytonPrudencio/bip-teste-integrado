import { Directive, ElementRef, HostListener, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[appCurrencyMask]',
  standalone: true,
  host: { inputmode: 'decimal' },
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

  writeValue(value: number | null | undefined): void {
    if (value === null || value === undefined || value === '' as unknown as number) {
      this.el.nativeElement.value = '';
      return;
    }
    const numeric = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(numeric)) {
      this.el.nativeElement.value = '';
      return;
    }
    this.el.nativeElement.value = this.format(numeric);
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
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    if (!digits) {
      input.value = '';
      this.onChange(null);
      return;
    }
    const numeric = Number(digits) / 100;
    input.value = this.format(numeric);
    this.onChange(numeric);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  private format(value: number): string {
    const fixed = value.toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    const intWithSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${intWithSep},${decPart}`;
  }
}
