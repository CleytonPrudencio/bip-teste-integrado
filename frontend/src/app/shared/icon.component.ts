import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

type IconName =
  | 'plus'
  | 'edit'
  | 'trash'
  | 'arrow-right'
  | 'wallet'
  | 'banknote'
  | 'activity'
  | 'check-circle'
  | 'alert-circle'
  | 'inbox'
  | 'history'
  | 'arrow-left-right'
  | 'sparkles';

const PATHS: Record<IconName, string> = {
  plus: '<path d="M12 5v14M5 12h14" stroke-linecap="round" />',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-linejoin="round" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linejoin="round" />',
  trash: '<polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />',
  'arrow-right': '<line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />',
  wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" />',
  banknote: '<rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" />',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke-linejoin="round" stroke-linecap="round" />',
  'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />',
  'alert-circle': '<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7" /><polyline points="3 3 3 9 9 9" /><polyline points="12 7 12 12 15 14" />',
  'arrow-left-right': '<polyline points="17 11 21 7 17 3" /><line x1="21" y1="7" x2="9" y2="7" /><polyline points="7 21 3 17 7 13" /><line x1="15" y1="17" x2="3" y2="17" />',
  sparkles: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke-linecap="round" />'
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
         [innerHTML]="markup()" [attr.aria-hidden]="true"></svg>
  `,
  styles: [`:host { display: inline-flex; align-items: center; line-height: 0; }`]
})
export class IconComponent implements OnChanges {
  private readonly sanitizer = inject(DomSanitizer);

  @Input() name: IconName = 'plus';
  @Input() size = 16;

  readonly markup = signal<SafeHtml>('');

  ngOnChanges(): void {
    const raw = PATHS[this.name] ?? '';
    this.markup.set(this.sanitizer.bypassSecurityTrustHtml(raw));
  }
}
