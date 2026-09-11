import { Type } from '@angular/core';
import { SignIn } from './pages/sign-in/sign-in';
import { SignUp } from './pages/sign-up/sign-up';
import { Account } from './pages/account/account';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Home } from './pages/home/home';
import { SupabaseService } from './core/services/supabase.service';
import { Router, provideRouter } from '@angular/router';
import { Header } from './shared/components/header/header';

describe('Routed pages', () => {
  const auth = {
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    getProfile: vi.fn(),
    getListingsByCategory: vi.fn().mockResolvedValue([]),
    getSession: vi.fn(),
    getUser: vi.fn(),
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    auth.getProfile.mockResolvedValue(null);
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await TestBed.configureTestingModule({
      imports: [Home, Header, SignIn, SignUp, Account],
      providers: [provideRouter(routes), { provide: SupabaseService, useValue: auth }],
    }).compileComponents();
  });

  async function render<T>(component: Type<T>) {
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function fillForm(element: HTMLElement, email: string, password: string) {
    for (const [id, value] of [['email', email], ['password', password]]) {
      const input = element.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
  }

  it('renders a public marketplace home without authentication fields', async () => {
    const fixture = await render(Home);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Bangla community');
    expect(element.querySelector('input[type="password"]')).toBeNull();
    expect(element.querySelector('input[type="email"]')).toBeNull();
    expect(element.querySelectorAll('.category-card')).toHaveLength(6);
    expect(element.querySelectorAll('.featured-card')).toHaveLength(4);
    expect(element.textContent).toContain('Sample listings');
    expect(element.querySelectorAll('img[loading="lazy"]')).toHaveLength(10);
    element.querySelector<HTMLButtonElement>('.business-cta button')!.click();
    fixture.detectChanges();
    expect(element.querySelector('.business-cta [role="status"]')?.textContent).toContain('Business listings are coming soon');
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(element.querySelector('[role="status"]')?.textContent).toContain('coming soon');
  });

  it('routes each URL to its dedicated page', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', Home);
    await harness.navigateByUrl('/sign-in', SignIn);
    await harness.navigateByUrl('/sign-up', SignUp);
    await harness.navigateByUrl('/account', Account);
    expect(harness.routeNativeElement?.textContent).toContain('You are not signed in.');
  });

  it('rejects invalid credentials without calling Supabase', async () => {
    const fixture = await render(SignIn);
    const element = fixture.nativeElement as HTMLElement;
    fillForm(element, 'invalid', '123');
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(auth.signIn).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Enter a valid email address.');
    expect(element.textContent).toContain('Enter a password with at least 6 characters.');
  });

  it('restores the current user and logs out', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { user: { email: 'member@example.com' } } }, error: null });
    auth.getUser.mockResolvedValue({ data: { user: { email: 'member@example.com' } }, error: null });
    auth.signOut.mockResolvedValue({ error: null });
    const fixture = await render(Account);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Welcome, member@example.com');
    expect(element.querySelector('form')).toBeNull();
    element.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(auth.signOut).toHaveBeenCalledOnce();
    expect(element.textContent).toContain('You are not signed in.');
    expect(element.textContent).toContain('You have been logged out.');
  });

  it('restores a persisted session in the header and shares sign-out with the page', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { user: { email: 'member@example.com' } } }, error: null });
    auth.getUser.mockResolvedValue({ data: { user: { email: 'member@example.com' } }, error: null });
    auth.signOut.mockResolvedValue({ error: null });
    const header = TestBed.createComponent(Header);
    header.detectChanges();
    await header.whenStable();
    header.detectChanges();
    const page = await render(SignIn);
    const element = header.nativeElement as HTMLElement;
    expect(element.querySelector('a[href="/account"]')?.textContent).toContain('My Account');
    expect(auth.getSession).toHaveBeenCalledOnce();
    expect(auth.getUser).toHaveBeenCalledOnce();
    element.querySelector<HTMLButtonElement>('button.primary')!.click();
    await header.whenStable();
    header.detectChanges();
    page.detectChanges();
    expect(auth.signOut).toHaveBeenCalledOnce();
    expect(element.querySelector('a[href="/sign-in"]')).toBeTruthy();
    expect((page.nativeElement as HTMLElement).querySelector('form')).toBeTruthy();
  });

  it('shows confirmation guidance when sign-up returns no session', async () => {
    auth.signUp.mockResolvedValue({ data: { session: null, user: null }, error: null });
    const fixture = await render(SignUp);
    const element = fixture.nativeElement as HTMLElement;
    fillForm(element, 'member@example.com', 'password123');
    for (const [id, value] of Object.entries({ first_name: '  Amina  ', last_name: '  Rahman ', city: ' Queens ', state: 'NY', sex: 'prefer_not_to_say', age_group: '25-34' })) {
      const field = element.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)!;
      field.value = value;
      field.dispatchEvent(new Event(field.tagName === 'SELECT' ? 'change' : 'input'));
    }
    expect(element.querySelectorAll('#state option')).toHaveLength(52);
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(auth.signUp).toHaveBeenCalledWith('member@example.com', 'password123', { first_name: 'Amina', last_name: 'Rahman', city: 'Queens', state: 'NY', sex: 'prefer_not_to_say', age_group: '25-34' });
    expect(element.textContent).toContain('Check your email for a confirmation link');
    expect(element.querySelector('form')).toBeTruthy();
  });

  it.each([true, false])('signup navigation follows the Supabase result: success=%s', async (succeeded) => {
    auth.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: succeeded ? null : new Error('Signup is unavailable'),
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/sign-up', SignUp);
    await harness.fixture.whenStable();
    harness.detectChanges();
    const element = harness.routeNativeElement!;
    fillForm(element, 'member@example.com', 'password123');
    for (const [id, value] of Object.entries({ first_name: 'Hussain', last_name: 'Rahman', city: 'Austin', state: 'TX', sex: 'male', age_group: '25-34' })) {
      const field = element.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)!;
      field.value = value;
      field.dispatchEvent(new Event(field.tagName === 'SELECT' ? 'change' : 'input'));
    }
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe(succeeded ? '/sign-up-success' : '/sign-up');
    if (succeeded) {
      expect(harness.routeNativeElement?.textContent).toContain('Thank you for signing up!');
      expect(harness.routeNativeElement?.querySelector('a[href="/sign-in"]')?.textContent).toContain('Go to Sign In');
      expect(harness.routeNativeElement?.textContent).not.toContain('password123');
    } else {
      expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain('Signup is unavailable');
    }
  });

  it.each(['/local/restaurants', '/local/groceries', 'https://example.com'])('handles login return URLs safely: %s', async (returnUrl) => {
    auth.signIn.mockResolvedValue({ data: { session: { user: { id: 'user-1', email: 'member@example.com' } } }, error: null });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/sign-in?returnUrl=' + encodeURIComponent(returnUrl));
    await harness.fixture.whenStable();
    harness.detectChanges();
    const element = harness.routeNativeElement!;
    fillForm(element, 'member@example.com', 'password123');
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url.split('?')[0]).toBe(returnUrl.startsWith('/local/') ? '/' : '/sign-in');
  });

  it('requires profile fields only on sign-up and rejects whitespace-only names', async () => {
    const fixture = await render(SignUp);
    const element = fixture.nativeElement as HTMLElement;
    fillForm(element, 'member@example.com', 'password123');
    const name = element.querySelector<HTMLInputElement>('#first_name')!;
    name.value = '   ';
    name.dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(auth.signUp).not.toHaveBeenCalled();
    expect(element.textContent).toContain('First Name is required.');
    expect(element.textContent).toContain('Select a state.');
  });

  it('disables buttons during login and displays authentication errors', async () => {
    let finish!: (value: unknown) => void;
    auth.signIn.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const fixture = await render(SignIn);
    const element = fixture.nativeElement as HTMLElement;
    fillForm(element, 'member@example.com', 'password123');
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect([...element.querySelectorAll('button')].every((button) => button.disabled)).toBe(true);
    finish({ data: { session: null }, error: new Error('Invalid login credentials') });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Invalid login credentials');
    expect(element.querySelector<HTMLButtonElement>('button')!.disabled).toBe(false);
  });
});
