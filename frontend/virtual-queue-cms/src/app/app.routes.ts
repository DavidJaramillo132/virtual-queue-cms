import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./presentation/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./presentation/register/register').then(m => m.Register)
  },
  {
    path: 'cliente',
    loadComponent: () =>
      import('./presentation/cliente/cliente').then(m => m.Cliente)
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' } // ruta por defect
];
