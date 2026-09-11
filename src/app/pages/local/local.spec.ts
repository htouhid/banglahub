import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ListingCard } from './listing-card/listing-card';
import { Restaurants } from './restaurants/restaurants';
import { Groceries } from './groceries/groceries';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import type { LocalListing } from '../../core/models/local-listing';

const listing: LocalListing = { id: 'listing-1', category: 'restaurant', title: 'Deshi Kitchen', image_url: null, address: '1 Main St', city: 'Austin', state: 'TX', brief_review: 'Fresh favorites', is_active: true };
describe('Local marketplace', () => {
  const api = { getListingsByCategory: vi.fn(), getApprovedReviews: vi.fn(), submitReview: vi.fn() };
  const auth = { user: signal<{ id: string } | null>({ id: 'user-1' }) };
  beforeEach(() => {
    vi.resetAllMocks();
    auth.user.set({ id: 'user-1' });
    api.getListingsByCategory.mockResolvedValue([listing]);
    api.getApprovedReviews.mockResolvedValue([]);
    api.submitReview.mockResolvedValue(undefined);
    TestBed.configureTestingModule({ providers: [provideRouter(routes), { provide: SupabaseService, useValue: api }, { provide: AuthStateService, useValue: auth }] });
  });
  async function card() {
    const fixture = TestBed.createComponent(ListingCard);
    fixture.componentRef.setInput('listing', listing);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
  it('loads the correct category for each page', async () => {
    for (const [component, category] of [[Restaurants, 'restaurant'], [Groceries, 'grocery']] as const) {
      const fixture = TestBed.createComponent(component);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(api.getListingsByCategory).toHaveBeenCalledWith(category);
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Deshi Kitchen');
    }
  });
  it('opens direct links as Home tabs and caches categories when switching', async () => {
    const harness = await RouterTestingHarness.create('/');
    await harness.fixture.whenStable();
    expect(api.getListingsByCategory).not.toHaveBeenCalled();
    await harness.navigateByUrl('/local/groceries');
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Discover your');
    expect(harness.routeNativeElement?.querySelector('mat-drawer')).toBeNull();
    expect(api.getListingsByCategory).toHaveBeenCalledExactlyOnceWith('grocery');
    const tabs = harness.routeNativeElement!.querySelectorAll<HTMLElement>('[role="tab"]');
    tabs[0].querySelector<HTMLElement>('.category-card')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(api.getListingsByCategory).toHaveBeenCalledWith('restaurant');
    expect(harness.routeNativeElement?.querySelectorAll('.mat-mdc-tab-body-active')).toHaveLength(1);
    tabs[1].querySelector<HTMLElement>('.category-card')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(api.getListingsByCategory).toHaveBeenCalledTimes(2);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    await harness.navigateByUrl('/local/restaurants');
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });

  it('filters listings by text and location, and clears a no-results search', async () => {
    const fixture = TestBed.createComponent(Restaurants);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('#restaurant-location')!;
    input.value = 'Boston';
    input.dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(element.querySelector('app-listing-card')).toBeNull();
    expect(element.textContent).toContain('No local matches yet');
    element.querySelector<HTMLButtonElement>('.state-card button')!.click();
    fixture.detectChanges();
    expect(element.querySelector('app-listing-card')).toBeTruthy();
  });

  it('handles missing images, failed images, and failed reviews', async () => {
    api.getApprovedReviews.mockRejectedValue(new Error('Unavailable'));
    const fixture = await card();
    expect(fixture.nativeElement.textContent).toContain('Photo coming soon');
    expect(fixture.nativeElement.textContent).toContain('Unable to load guest reviews');
    fixture.componentRef.setInput('listing', { ...listing, image_url: 'https://example.com/photo.jpg' });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Photo coming soon');
  });

  it('shows only approved reviews and handles empty reviews', async () => {
    const fixture = await card();
    expect(fixture.nativeElement.textContent).toContain('No guest reviews yet.');
    api.getApprovedReviews.mockResolvedValue([{ id: '1', feedback: 'Public review', status: 'approved' }, { id: '2', feedback: 'Private review', status: 'pending' }]);
    const second = await card();
    expect(second.nativeElement.textContent).toContain('Public review');
    expect(second.nativeElement.textContent).not.toContain('Private review');
  });
  it('validates feedback, submits the current UUID, and keeps pending feedback private', async () => {
    const fixture = await card();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.feedback-panel')?.getAttribute('aria-hidden')).toBe('true');
    element.querySelector<HTMLButtonElement>('.text-button')!.click();
    fixture.detectChanges();
    expect(element.querySelector('.feedback-panel')?.classList.contains('open')).toBe(true);
    const textarea = element.querySelector('textarea')!;
    expect(textarea.maxLength).toBe(500);
    for (const value of ['   ', 'a'.repeat(501)]) {
      textarea.value = value;
      textarea.dispatchEvent(new Event('input'));
      element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      fixture.detectChanges();
      expect(api.submitReview).not.toHaveBeenCalled();
    }
    textarea.value = ' Great food! ';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.querySelector('.counter')?.textContent).toContain('13 / 500');
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(api.submitReview).toHaveBeenCalledWith('listing-1', 'user-1', 'Great food!');
    expect(element.textContent).toContain('Thank you! Your feedback has been submitted for review.');
    expect(element.querySelector('.reviews')?.textContent).not.toContain('Great food!');
  });
  it('offers sign in instead of a feedback form to guests', async () => {
    auth.user.set(null);
    const fixture = await card();
    expect(fixture.nativeElement.querySelector('textarea')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href^="/sign-in"]')).toBeTruthy();
  });
});
