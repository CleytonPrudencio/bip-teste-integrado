import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BalancePoint {
  date: Date;
  balance: number;
  label?: string;
}

@Component({
  selector: 'app-balance-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (data().length < 2) {
      <div class="empty-state" style="padding: 1.5rem 0;">
        <p class="muted" style="margin: 0;font-size: 0.85rem;">
          Saldo ainda nao tem evolucao para plotar (precisa de pelo menos 2 pontos).
        </p>
      </div>
    } @else {
      <div class="chart-wrapper">
        <svg [attr.viewBox]="viewBox()" preserveAspectRatio="none" class="chart-svg">
          <defs>
            <linearGradient id="balance-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.32" />
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
            </linearGradient>
          </defs>
          @for (line of gridLines(); track line.y) {
            <line [attr.x1]="padX" [attr.y1]="line.y"
                  [attr.x2]="width - padX" [attr.y2]="line.y"
                  stroke="#e2e8f0" stroke-dasharray="3 3" />
          }
          <path [attr.d]="areaPath()" fill="url(#balance-grad)" />
          <path [attr.d]="linePath()" fill="none" stroke="#2563eb" stroke-width="2"
                stroke-linejoin="round" stroke-linecap="round" />
          @for (p of pointsXY(); track p.idx) {
            <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3.5" fill="white" stroke="#2563eb" stroke-width="2" />
          }
        </svg>

        <div class="chart-axis-y">
          @for (l of labelsY(); track l.value) {
            <span [style.top.%]="l.top">{{ l.value | currency:'BRL':'symbol':'1.0-0':'pt-BR' }}</span>
          }
        </div>

        <div class="chart-axis-x">
          <span>{{ first()?.date | date:'short' }}</span>
          <span>{{ last()?.date | date:'short' }}</span>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .chart-wrapper {
      position: relative;
      padding: 0.5rem 0 1.5rem 3.5rem;
    }
    .chart-svg {
      width: 100%;
      height: 220px;
      display: block;
    }
    .chart-axis-y {
      position: absolute;
      top: 0.5rem;
      left: 0;
      height: 220px;
      width: 3rem;
      font-size: 0.7rem;
      color: var(--color-muted);
    }
    .chart-axis-y span {
      position: absolute;
      right: 0.4rem;
      transform: translateY(-50%);
    }
    .chart-axis-x {
      display: flex;
      justify-content: space-between;
      font-size: 0.7rem;
      color: var(--color-muted);
      margin-top: 0.25rem;
      padding-left: 0;
    }
  `]
})
export class BalanceChartComponent {
  private readonly internal = signal<BalancePoint[]>([]);

  @Input() set points(value: BalancePoint[]) {
    this.internal.set(value ?? []);
  }

  readonly width = 600;
  readonly height = 220;
  readonly padX = 12;
  readonly padY = 16;

  data = () => [...this.internal()].sort((a, b) => a.date.getTime() - b.date.getTime());

  viewBox = computed(() => `0 0 ${this.width} ${this.height}`);

  first = () => this.data()[0];
  last = () => this.data()[this.data().length - 1];

  private bounds = computed(() => {
    const vals = this.data().map((p) => p.balance);
    let min = Math.min(...vals);
    let max = Math.max(...vals);
    if (min === max) {
      min = min - 1;
      max = max + 1;
    }
    return { min, max };
  });

  private mapX = (idx: number, total: number) =>
    this.padX + (idx / Math.max(1, total - 1)) * (this.width - 2 * this.padX);

  private mapY = (val: number) => {
    const { min, max } = this.bounds();
    const ratio = (val - min) / (max - min);
    return this.height - this.padY - ratio * (this.height - 2 * this.padY);
  };

  pointsXY = computed(() => {
    const total = this.data().length;
    return this.data().map((p, idx) => ({
      idx,
      x: this.mapX(idx, total),
      y: this.mapY(p.balance),
      balance: p.balance
    }));
  });

  linePath = computed(() => {
    const xy = this.pointsXY();
    if (xy.length === 0) return '';
    return xy.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  });

  areaPath = computed(() => {
    const xy = this.pointsXY();
    if (xy.length === 0) return '';
    const baseY = this.height - this.padY;
    const line = xy.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    return `${line} L ${xy[xy.length - 1].x.toFixed(1)} ${baseY} L ${xy[0].x.toFixed(1)} ${baseY} Z`;
  });

  gridLines = computed(() => {
    const result: Array<{ y: number }> = [];
    for (let i = 0; i <= 4; i++) {
      const y = this.padY + ((this.height - 2 * this.padY) * i) / 4;
      result.push({ y });
    }
    return result;
  });

  labelsY = computed(() => {
    const { min, max } = this.bounds();
    const result: Array<{ value: number; top: number }> = [];
    for (let i = 0; i <= 4; i++) {
      const ratio = 1 - i / 4;
      result.push({
        value: min + ratio * (max - min),
        top: (i / 4) * 100
      });
    }
    return result;
  });
}
