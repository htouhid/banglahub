import { afterNextRender, Injectable, DestroyRef, inject, Injector, PendingTasks, signal } from '@angular/core';
import type { SignUpProfile, UserProfile } from '../models/profile';
import type { User } from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pendingTasks = inject(PendingTasks);
  private supabase?: SupabaseService;

  private profileRequest?: Promise<void>;
  private profileUserId: string | null = null;
  private generation = 0;
  private authRevision = 0;
  readonly profile = signal<UserProfile | null>(null);
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
      const { data: listener } = this.supabase.onAuthStateChange((_event, session) => {
        this.authRevision++;
        // Supabase callbacks must remain synchronous. Defer database work until
        // the auth callback releases its lock.
        void this.setUser(session?.user ?? null);
      });
      this.destroyRef.onDestroy(() => listener.subscription.unsubscribe());

      const revision = this.authRevision;
      const { data, error } = await this.supabase.getSession();
      if (error) throw error;
      if (data.session) {
        const { data: userData, error: userError } = await this.supabase.getUser();
        if (userError) throw userError;
        if (revision === this.authRevision) await this.setUser(userData.user);
      }
      await this.profileRequest;
    } catch {
      this.error.set('Unable to initialize authentication. Check the Supabase project URL and publishable key, then reload the page.');
      this.supabase = undefined;
    } finally {
      this.initializing.set(false);
    }
  }

  private setUser(user: User | null): Promise<void> {
    if (this.destroyRef.destroyed) return Promise.resolve();
    this.user.set(user);
    const id = user?.id ?? null;
    if (id === this.profileUserId) return this.profileRequest ?? Promise.resolve();
    this.profileUserId = id;
    const generation = ++this.generation;
    this.profile.set(null);
    this.profileRequest = undefined;
    if (!id) return Promise.resolve();
    this.profileRequest = Promise.resolve().then(async () => {
      try {
        const profile = await this.supabase?.getProfile(id);
        if (!this.destroyRef.destroyed && generation === this.generation) {
          this.profile.set(profile ?? null);
        }
      } catch {
        // Missing or inaccessible profiles never invalidate authentication.
        if (!this.destroyRef.destroyed && generation === this.generation) this.profile.set(null);
      }
    });
    return this.profileRequest;
  }

  async authenticate(action: 'signUp' | 'signIn', email: string, password: string, profile?: SignUpProfile): Promise<boolean> {
    if (this.busy() || this.initializing()) return false;
    this.error.set('');
    this.success.set('');
    if (!this.supabase) {
      this.error.set('Authentication is unavailable. Please reload the page and try again.');
      return false;
    }

    this.busy.set(true);
    try {
      if (action === 'signUp' && !profile) throw new Error('Please complete all profile fields.');
      const { data, error } = action === 'signUp' && profile
        ? await this.supabase.signUp(email, password, profile)
        : await this.supabase.signIn(email, password);
      if (error) throw error;
      await this.setUser(data.session?.user ?? null);
      this.success.set(action === 'signIn'
        ? 'You are now logged in.'
        : data.session
          ? 'Your account has been created. Welcome to Bangla Hub!'
          : 'Sign-up request received. Check your email for a confirmation link before logging in.');
      return true;
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
      return false;
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
      await this.setUser(null);
      this.success.set('You have been logged out. See you again soon!');
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Unable to log out. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }
}
