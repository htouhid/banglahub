import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { adminGuard } from './admin-guard';
import { SupabaseService } from '../services/supabase.service';
import { routes } from '../../app.routes';

describe('Admin authorization', () => {
  const api = {getUser: vi.fn(), getProfile: vi.fn()};
  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({providers:[provideRouter([]), {provide:SupabaseService,useValue:api}]});
  });
  it('protects the dashboard and every child transition using the same guard', () => {
    const admin = routes.find(route => route.path === 'admin')!;
    expect(admin.canActivate).toContain(adminGuard);
    expect(admin.canActivateChild).toContain(adminGuard);
    const dashboard = admin.children!.find(route => route.path === '')!;
    expect(dashboard.redirectTo).toBeUndefined();
    expect(dashboard.loadComponent).toBeTruthy();
    for(const path of ['listings','events','events/new','events/:id/edit']) expect(admin.children!.some(route=>route.path===path)).toBe(true);
  });
  it.each([
    [null, null, '/sign-in'],
    [{id:'member'}, {role:'member'}, '/'],
    [{id:'member'}, null, '/'],
    [{id:'admin'}, {role:'admin'}, true],
  ])('checks authentication and admin profile role', async (user, profile, expected) => {
    api.getUser.mockResolvedValue({data:{user},error:null});
    api.getProfile.mockResolvedValue(profile);
    const result = await TestBed.runInInjectionContext(() => adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
    expect(result === true ? true : TestBed.inject(Router).serializeUrl(result as import('@angular/router').UrlTree)).toBe(expected);
  });
});
