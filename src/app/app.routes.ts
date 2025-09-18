import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home-page.component'),
  },
  {
    path: '404',
    loadComponent: () => import('./pages/error/error404-page.component')
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/404',
  }
];
