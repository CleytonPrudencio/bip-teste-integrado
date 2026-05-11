import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'beneficios', pathMatch: 'full' },
  {
    path: 'beneficios',
    loadComponent: () =>
      import('./beneficios/beneficio-list.component').then((m) => m.BeneficioListComponent)
  },
  {
    path: 'beneficios/novo',
    loadComponent: () =>
      import('./beneficios/beneficio-form.component').then((m) => m.BeneficioFormComponent)
  },
  {
    path: 'beneficios/:id',
    loadComponent: () =>
      import('./beneficios/beneficio-detail.component').then((m) => m.BeneficioDetailComponent)
  },
  {
    path: 'beneficios/:id/editar',
    loadComponent: () =>
      import('./beneficios/beneficio-form.component').then((m) => m.BeneficioFormComponent)
  },
  {
    path: 'transferencias',
    loadComponent: () =>
      import('./transferencias/transferencia.component').then((m) => m.TransferenciaComponent)
  },
  {
    path: 'transferencias/historico',
    loadComponent: () =>
      import('./transferencias/historico.component').then((m) => m.HistoricoComponent)
  },
  { path: '**', redirectTo: 'beneficios' }
];
