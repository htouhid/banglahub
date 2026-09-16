import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Home category query parameters select distinct canonical marketplace pages.
  { path: '', renderMode: RenderMode.Server },
  { path: 'events/:id', renderMode: RenderMode.Server },
  {
    path: 'admin/**',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];