import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { LocalListingSlider } from './local-listing-slider';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import type { LocalListing } from '../../../core/models/local-listing';

const listings: LocalListing[] = Array.from({ length: 5 }, (_, i) => ({ id: String(i), title: `Restaurant ${i}`, category: 'restaurant', image_url: `https://example.com/${i}.jpg`, address: `${i} Main St`, city: 'Austin', state: 'TX', brief_review: `Review ${i}`, is_active: true }));
describe('Restaurant slider', () => {
  const api = { getApprovedReviews: vi.fn(), submitReview: vi.fn() };
  beforeEach(() => {
    vi.resetAllMocks();
    api.getApprovedReviews.mockImplementation(async (id: string) => [{ id, feedback: `Guest ${id}`, status: 'approved' }]);
    api.submitReview.mockResolvedValue(undefined);
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: SupabaseService, useValue: api }, { provide: AuthStateService, useValue: { user: signal({ id: 'user-1' }) } }] });
  });
  async function render(items = listings) {
    const fixture = TestBed.createComponent(LocalListingSlider);
    fixture.componentRef.setInput('listings', items);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
  it('selects the first listing and wraps next/previous through all five', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance.selectedListing()?.id).toBe('0');
    expect(element.querySelector('.track')?.getAttribute('style')).toContain('translateX(-0%)');
    expect(element.querySelector('img')?.alt).toBe('Restaurant 0');
    expect(element.querySelector('.overlay')?.textContent).toContain('Review 0');
    element.querySelector<HTMLButtonElement>('.previous')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedListing()?.id).toBe('4');
    element.querySelector<HTMLButtonElement>('.next')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedListing()?.id).toBe('0');
    element.querySelector<HTMLButtonElement>('.next')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedListing()?.id).toBe('1');
  });
  it('selects by name and scopes reviews and feedback to the active ID', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;
    const selector = element.querySelectorAll<HTMLButtonElement>('.selector')[2];
    expect(selector.type).toBe('button');
    selector.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(selector.getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelectorAll('img')[2]?.getAttribute('src')).toContain('/2.jpg');
    expect(element.querySelector('.track')?.getAttribute('style')).toContain('translateX(-200%)');
    expect(element.querySelectorAll('.slide')).toHaveLength(5);
    expect(selector.textContent).toContain(listings[2].title);
    expect(selector.classList.contains('active')).toBe(true);
    expect(element.querySelector('.reviews')?.textContent).toContain('Guest 2');
    expect(element.querySelector('.reviews')?.textContent).not.toContain('Guest 0');
    element.querySelector<HTMLButtonElement>('.text-button')!.click();
    fixture.detectChanges();
    const textarea = element.querySelector('textarea')!;
    textarea.value = 'Great meal';
    textarea.dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    expect(api.submitReview).toHaveBeenCalledWith('2', 'user-1', 'Great meal');
  });
  it('supports arrow-key navigation between numbered selectors', async () => {
    const fixture = await render();
    const buttons = fixture.nativeElement.querySelectorAll('.selector') as NodeListOf<HTMLButtonElement>;
    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedIndex()).toBe(1);
    expect(buttons[1].getAttribute('aria-current')).toBe('true');
    expect(fixture.nativeElement.querySelector('.track').style.transform).toBe('translateX(-100%)');
  });

  it('handles no listings and failed images', async () => {
    const fixture = await render([]);
    expect(fixture.nativeElement.textContent).toContain('No restaurants found');
    expect(api.getApprovedReviews).not.toHaveBeenCalled();
    fixture.componentRef.setInput('listings', listings);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Photo coming soon');
  });
});
