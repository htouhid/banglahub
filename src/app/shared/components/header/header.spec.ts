import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { Header } from './header';

 describe('Header', () => {
  const auth = {
    user: signal<{ email: string } | null>(null),
    initializing: signal(false),
    busy: signal(false),
    error: signal(''),
    logout: vi.fn(),
  };

  beforeEach(async () => {
    auth.user.set(null);
    auth.busy.set(false);
    auth.logout.mockClear();
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), { provide: AuthStateService, useValue: auth }],
    }).compileComponents();
  });

  it('links to authentication and toggles the simple menu', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('a[href="/sign-in"]')).toBeTruthy();
    expect(element.querySelector('a[href="/sign-up"]')).toBeTruthy();
    const menu = element.querySelector<HTMLButtonElement>('.menu-button')!;
    menu.click();
    fixture.detectChanges();
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('nav')?.classList.contains('open')).toBe(true);
  });

  it('shares authentication state and signs out through the auth service', () => {
    const fixture = TestBed.createComponent(Header);
    auth.user.set({ email: 'member@example.com' });
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('a[href="/account"]')?.textContent).toContain('My Account');
    expect(element.querySelector('a[href="/sign-in"]')).toBeNull();
    element.querySelector<HTMLButtonElement>('.primary')!.click();
    expect(auth.logout).toHaveBeenCalledOnce();
    auth.busy.set(true);
    fixture.detectChanges();
    expect(element.querySelector<HTMLButtonElement>('.primary')!.disabled).toBe(true);
  });
});
