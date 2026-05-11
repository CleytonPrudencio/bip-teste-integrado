import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/toast.component';
import { ConfirmComponent } from './shared/confirm.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ToastComponent, ConfirmComponent],
  template: `
    <header class="app-header">
      <div class="container header-content">
        <h1 class="logo">
          <span class="logo-mark">B</span>
          Beneficios
        </h1>
        <nav>
          <a routerLink="/beneficios" routerLinkActive="active">Beneficios</a>
          <a routerLink="/transferencias" routerLinkActive="active">Transferencias</a>
        </nav>
      </div>
    </header>

    <main class="container">
      <router-outlet></router-outlet>
    </main>

    <app-toast></app-toast>
    <app-confirm></app-confirm>
  `,
  styles: [`
    .app-header {
      background-color: white;
      border-bottom: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1.25rem 1.5rem;
    }
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .logo {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      color: var(--color-text);
    }
    .logo-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background-color: var(--color-primary);
      color: white;
      font-weight: 700;
    }
    nav {
      display: flex;
      gap: 1rem;
    }
    nav a {
      color: var(--color-muted);
      font-weight: 500;
      padding: 0.4rem 0.75rem;
      border-radius: var(--radius);
      transition: all 0.15s ease;
    }
    nav a:hover {
      color: var(--color-text);
      background-color: var(--color-bg);
      text-decoration: none;
    }
    nav a.active {
      color: var(--color-primary);
      background-color: rgba(37, 99, 235, 0.08);
    }
    main.container {
      padding-top: 2rem;
      padding-bottom: 3rem;
    }
  `]
})
export class AppComponent {}
