import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const adminGuard: CanActivateFn = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  const {
    data: { user },
    error
  } = await supabaseService.getUser();

  console.log('ADMIN GUARD USER:', user);
  console.log('ADMIN GUARD USER ERROR:', error);

  if (error || !user) {
    console.log('NO USER - redirecting to sign-in');
    return router.createUrlTree(['/sign-in']);
  }

  try {
    const profile = await supabaseService.getProfile(user.id);

    console.log('ADMIN GUARD PROFILE:', profile);
    console.log('ADMIN GUARD ROLE:', profile?.role);

    if (profile?.role === 'admin') {
      console.log('ADMIN ACCESS GRANTED');
      return true;
    }

    console.log('NOT ADMIN - redirecting home');
    return router.createUrlTree(['/']);

  } catch (error) {
    console.error('ADMIN GUARD FAILED:', error);
    return router.createUrlTree(['/']);
  }
};