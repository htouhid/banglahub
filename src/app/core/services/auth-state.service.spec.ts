import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { vi } from 'vitest';
import { AuthStateService } from './auth-state.service';
import { SupabaseService } from './supabase.service';

@Component({ template: '' })
class Host { readonly auth = inject(AuthStateService); }

describe('Shared profile state', () => {
  const user = { id: 'user-1', email: 'member@example.com' } as User;
  const session = { user } as Session;
  const profile = { id: user.id, first_name: 'Hussain' };
  let listener: (event: AuthChangeEvent, session: Session | null) => void;
  const api = {
    onAuthStateChange: vi.fn(), getSession: vi.fn(), getUser: vi.fn(),
    getProfile: vi.fn(), signIn: vi.fn(), signOut: vi.fn(),
  };
  beforeEach(() => {
    vi.resetAllMocks();
    api.onAuthStateChange.mockImplementation((callback) => {
      listener = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    api.getSession.mockResolvedValue({ data: { session }, error: null });
    api.getUser.mockResolvedValue({ data: { user }, error: null });
    api.getProfile.mockResolvedValue(profile);
    api.signOut.mockResolvedValue({ error: null });
    TestBed.configureTestingModule({ providers: [{ provide: SupabaseService, useValue: api }] });
  });
  async function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.componentInstance.auth;
  }
  it('restores the profile once, deduplicates signed-in events, and clears it on logout', async () => {
    const auth = await render();
    expect(auth.profile()).toEqual(profile);
    listener('SIGNED_IN', session);
    listener('TOKEN_REFRESHED', session);
    await Promise.resolve();
    expect(api.getProfile).toHaveBeenCalledExactlyOnceWith(user.id);
    await auth.logout();
    expect(auth.user()).toBeNull();
    expect(auth.profile()).toBeNull();
  });
  it('deduplicates login response and signed-in event', async () => {
    api.getSession.mockResolvedValue({ data: { session: null }, error: null });
    const auth = await render();
    api.signIn.mockImplementation(async () => {
      listener('SIGNED_IN', session);
      return { data: { session }, error: null };
    });
    await auth.authenticate('signIn', user.email!, 'password123');
    expect(auth.profile()).toEqual(profile);
    expect(api.getProfile).toHaveBeenCalledExactlyOnceWith(user.id);
  });
  it('keeps the user signed in when a profile is missing or fails to load', async () => {
    api.getProfile.mockResolvedValue(null);
    const auth = await render();
    expect(auth.user()?.id).toBe(user.id);
    expect(auth.profile()).toBeNull();
    listener('SIGNED_OUT', null);
    api.getProfile.mockRejectedValue(new Error('Network unavailable'));
    api.signIn.mockResolvedValue({ data: { session }, error: null });
    await auth.authenticate('signIn', user.email!, 'password123');
    expect(auth.user()?.id).toBe(user.id);
    expect(auth.profile()).toBeNull();
    expect(auth.error()).toBe('');
  });
  it('ignores an in-flight profile response after logout', async () => {
    const auth = await render();
    listener('SIGNED_OUT', null);
    let resolve!: (value: unknown) => void;
    api.getProfile.mockReturnValue(new Promise((done) => { resolve = done; }));
    listener('SIGNED_IN', session);
    await Promise.resolve();
    await auth.logout();
    resolve(profile);
    await Promise.resolve();
    await Promise.resolve();
    expect(auth.profile()).toBeNull();
    expect(auth.user()).toBeNull();
  });
});
