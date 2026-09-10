import { afterNextRender, Injectable, DestroyRef, inject, Injector, PendingTasks, signal } from '@angular/core';
import type { User } from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pendingTasks = inject(PendingTasks);
  private supabase?: SupabaseService;

  readonly user = signal<User | null>(null);
  readonly initializing = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  constructor() {
    // Render callbacks run only in the browser, after hydration. Defer even
    // constructing the Supabase client so SSR never initializes browser auth.
    afterNextRender(() => this.pendingTasks.run(() => this.initializeAuth()));
  }

  private async initializeAuth(): Promise<void> {
    try {
      this.supabase = this.injector.get(SupabaseService);
      const { data: listener } = this.supabase.client.auth.onAuthStateChange((_event, session) => {
        if (!this.destroyRef.destroyed) this.user.set(session?.user ?? null);
      });
      this.destroyRef.onDestroy(() => listener.subscription.unsubscribe());

      const { data, error } = await this.supabase.getSession();
      if (error) throw error;
      if (data.session) {
        const { data: userData, error: userError } = await this.supabase.getUser();
        if (userError) throw userError;
        if (!this.destroyRef.destroyed) this.user.set(userData.user);
      }
    } catch {
      this.error.set('Unable to initialize authentication. Check the Supabase project URL and publishable key, then reload the page.');
      this.supabase = undefined;
    } finally {
      this.initializing.set(false);
    }
  }

  async authenticate(action: 'signUp' | 'signIn', email: string, password: string): Promise<void> {
    if (this.busy() || this.initializing()) return;
    this.error.set('');
    this.success.set('');
    if (!this.supabase) {
      this.error.set('Authentication is unavailable. Please reload the page and try again.');
      return;
    }

    this.busy.set(true);
    try {
      const { data, error } = await this.supabase[action](email, password);
      if (error) throw error;
      this.user.set(data.session?.user ?? null);
      this.success.set(action === 'signIn'
        ? 'You are now logged in.'
        : data.session
          ? 'Your account has been created. Welcome to Bangla Hub!'
          : 'Sign-up request received. Check your email for a confirmation link before logging in.');
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }

  async logout(): Promise<void> {
    if (!this.supabase || this.busy() || this.initializing()) return;
    this.busy.set(true);
    this.error.set('');
    this.success.set('');
    try {
      const { error } = await this.supabase.signOut();
      if (error) throw error;
      this.user.set(null);
      this.success.set('You have been logged out. See you again soon!');
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Unable to log out. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }
}
