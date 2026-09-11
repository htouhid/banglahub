import { SignUpSuccess } from './pages/sign-up-success/sign-up-success';
import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { SignIn } from './pages/sign-in/sign-in';
import { SignUp } from './pages/sign-up/sign-up';
import { Account } from './pages/account/account';
import { Home } from './pages/home/home';
import { Placeholder } from './pages/placeholder/placeholder';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full', title: 'Bangla Hub' },
  { path: 'local/restaurants', redirectTo: () => inject(Router).createUrlTree(['/'], { queryParams: { category: 'restaurants' } }) },
  { path: 'local/groceries', redirectTo: () => inject(Router).createUrlTree(['/'], { queryParams: { category: 'groceries' } }) },
  { path: 'sign-in', component: SignIn, title: 'Sign In | Bangla Hub' },
  { path: 'sign-up', component: SignUp, title: 'Sign Up | Bangla Hub' },
  { path: 'sign-up-success', component: SignUpSuccess, title: 'Thank you | Bangla Hub' },
  { path: 'news', loadComponent: () => import('./pages/news/news').then(m => m.News), title: 'Bangladesh News | Bangla Hub' },
  { path: 'account', component: Account, title: 'My Account | Bangla Hub' },
  ...['businesses', 'events', 'jobs', 'community', 'about', 'contact', 'privacy', 'terms'].map((path) => ({
    path,
    component: Placeholder,
    title: `${path[0].toUpperCase()}${path.slice(1)} | Bangla Hub`,
    data: { title: `${path[0].toUpperCase()}${path.slice(1)}` },
  })),
  { path: '**', component: Placeholder, title: 'Page not found | Bangla Hub', data: { title: 'Page not found' } },
];
