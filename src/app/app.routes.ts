import { SignUpSuccess } from './pages/sign-up-success/sign-up-success';
import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { SignIn } from './pages/sign-in/sign-in';
import { SignUp } from './pages/sign-up/sign-up';
import { Account } from './pages/account/account';
import { Home } from './pages/home/home';
import { Placeholder } from './pages/placeholder/placeholder';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [

{
  path: 'admin',
  canActivate: [adminGuard],
  canActivateChild: [adminGuard],
  children: [
    { path: 'events', loadComponent: () => import('./admin/admin-events/admin-events').then(m => m.AdminEvents) },
    { path: 'events/new', loadComponent: () => import('./admin/admin-events/admin-event-form').then(m => m.AdminEventForm) },
    { path: 'events/:id/edit', loadComponent: () => import('./admin/admin-events/admin-event-form').then(m => m.AdminEventForm) },
    {
      path: '',
      pathMatch: 'full',
      loadComponent: () => import('./admin/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard)
    },
    {
      path: 'listings',
      loadComponent: () =>
        import('./admin/admin-listings/admin-listings')
          .then(m => m.AdminListings)
    },
    {
      path: 'listings/new',
      loadComponent: () =>
        import('./admin/admin-listing-form/admin-listing-form')
          .then(m => m.AdminListingForm)
    },
    {
      path: 'listings/:id/edit',
      loadComponent: () =>
        import('./admin/admin-listing-form/admin-listing-form')
          .then(m => m.AdminListingForm)
    }
  ]
},  // <-- THIS COMMA IS IMPORTANT
  
  { path: '', component: Home, pathMatch: 'full', title: 'Bangla Hub' },
  { path: 'local/restaurants', redirectTo: () => inject(Router).createUrlTree(['/'], { queryParams: { category: 'restaurants' } }) },
  { path: 'local/groceries', redirectTo: () => inject(Router).createUrlTree(['/'], { queryParams: { category: 'groceries' } }) },
  { path: 'sign-in', component: SignIn, title: 'Sign In | Bangla Hub' },
  { path: 'sign-up', component: SignUp, title: 'Sign Up | Bangla Hub' },
  { path: 'sign-up-success', component: SignUpSuccess, title: 'Thank you | Bangla Hub' },
  { path: 'news', loadComponent: () => import('./pages/news/news').then(m => m.News), title: 'Bangladesh News | Bangla Hub' },
  { path: 'housing/new/listing', data: { postType: 'listing' }, loadComponent: () => import('./pages/housing/housing-form').then(m => m.HousingForm), title: 'Post a Property | Bangla Hub' },
  { path: 'housing/new/wanted', data: { postType: 'wanted' }, loadComponent: () => import('./pages/housing/housing-form').then(m => m.HousingForm), title: 'Post Housing Need | Bangla Hub' },
  { path: 'housing', loadComponent: () => import('./pages/housing/housing').then(m => m.Housing), title: 'Housing | Bangla Hub' },
  { path: 'events', loadComponent: () => import('./pages/events/events').then(m => m.Events), title: 'Events | Bangla Hub' },
  { path: 'events/:id', loadComponent: () => import('./pages/events/event-detail').then(m => m.EventDetail), title: 'Event Details | Bangla Hub' },
  { path: 'services', loadComponent: () => import('./pages/services/services').then(m => m.Services), title: 'Community Services | Bangla Hub' },
  { path: 'jobs/new', loadComponent: () => import('./pages/jobs/job-form').then(m => m.JobForm), title: 'Post a Job | Bangla Hub' },
  { path: 'jobs', loadComponent: () => import('./pages/jobs/jobs').then(m => m.Jobs), title: 'Community Jobs | Bangla Hub' },
  { path: 'account', component: Account, title: 'My Account | Bangla Hub' },
  ...['businesses', 'community', 'about', 'contact', 'privacy', 'terms'].map((path) => ({
    path,
    component: Placeholder,
    title: `${path[0].toUpperCase()}${path.slice(1)} | Bangla Hub`,
    data: { title: `${path[0].toUpperCase()}${path.slice(1)}` },
  })),
  { path: '**', component: Placeholder, title: 'Page not found | Bangla Hub', data: { title: 'Page not found' } },
];
