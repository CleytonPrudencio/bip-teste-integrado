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
    path: 'beneficios/:id/editar',
    loadComponent: () =>
      import('./beneficios/beneficio-form.component').then((m) => m.BeneficioFormComponent)
  },
  {
    path: 'transferencias',
    loadComponent: () =>
      import('./transferencias/transferencia.component').then((m) => m.TransferenciaComponent)
  },
  { path: '**', redirectTo: 'beneficios' }
];
