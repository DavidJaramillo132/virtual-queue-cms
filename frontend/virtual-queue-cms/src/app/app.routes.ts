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
    path: 'admin-local',
    loadComponent: () =>
      import('./presentation/adminLocal/admin-local').then(m => m.AdminLocal)
  },
  {
    path: 'admin-general',
    loadComponent: () =>
      import('./presentation/adminGeneral/admin-general').then(m => m.AdminGeneral)
  },
  {
    path: 'perfil',
    loadComponent: () =>
      import('./presentation/perfil/perfil').then(m => m.PerfilComponent)
  },
  {
    path: 'welcome',
    loadComponent: () => 
      import('./presentation/welcome-page/welcome-page').then(m => m.WelcomePage)
  },
  { 
    path: '', 
    redirectTo: '/welcome', 
    pathMatch: 'full' 
  },
  {
    path: '**',
    redirectTo: '/welcome'
  }
];
