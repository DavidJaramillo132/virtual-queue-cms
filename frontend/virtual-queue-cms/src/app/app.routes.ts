import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./presentation/auth-user/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./presentation/auth-user/register/register').then(m => m.Register)
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./presentation/home/home').then(m => m.Home)
  },
  {
    path: 'business/:id',
    loadComponent: () =>
      import('./presentation/business/business').then(m => m.Business)
  },
  {
    path: 'business',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
