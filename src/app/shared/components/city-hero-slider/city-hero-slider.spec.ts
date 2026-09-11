import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { CityContextService } from '../../../core/services/city-context.service';
import { CityHeroSlider } from './city-hero-slider';

describe('City hero', () => {
  const user = signal<{id: string} | null>(null);
  const profile = signal<{city: string; state: string} | null>(null);
  beforeEach(() => {
    sessionStorage.clear();
    user.set(null); profile.set(null);
    TestBed.configureTestingModule({ providers: [
      { provide: AuthStateService, useValue: { user, profile } },
    ] });
  });
  afterEach(() => sessionStorage.clear());
  async function render() {
    const fixture = TestBed.createComponent(CityHeroSlider);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
  it.each([
    [null, 'austin'],
    [{city: 'Austin', state: 'TX'}, 'austin'],
    [{city: ' Atlanta ', state: 'ga'}, 'atlanta'],
    [{city: 'Boston', state: 'MA'}, 'austin'],
  ])('initializes from the profile or default', async (value, expected) => {
    profile.set(value);
    if (value) user.set({id: 'member'});
    await render();
    expect(TestBed.inject(CityContextService).selectedCity().key).toBe(expected);
  });
  it('shares a Dallas selection and remembers it for this browser session', async () => {
    const fixture = await render();
    fixture.nativeElement.querySelector('#city-tab-dallas').click();
    fixture.detectChanges();
    expect(TestBed.inject(CityContextService).selectedCity().key).toBe('dallas');
    expect(sessionStorage.getItem('banglahub.city')).toBe('dallas');
    expect(fixture.nativeElement.querySelector('#city-tab-dallas').getAttribute('aria-selected')).toBe('true');
  });
  it('restores an explicit choice before profile defaults', async () => {
    sessionStorage.setItem('banglahub.city', 'chicago');
    profile.set({city: 'Atlanta', state: 'GA'}); user.set({id: 'member'});
    await render();
    expect(TestBed.inject(CityContextService).selectedCity().key).toBe('chicago');
  });
  it('supports arrow keys, Home, End and roving keyboard focus', async () => {
    const fixture = await render();
    for (const [key, expected] of [['ArrowRight','dallas'], ['End','atlanta'], ['ArrowRight','austin'], ['ArrowLeft','atlanta'], ['Home','austin']]) {
      fixture.nativeElement.querySelector('[aria-selected="true"]').dispatchEvent(new KeyboardEvent('keydown', {key, bubbles: true}));
      fixture.detectChanges();
      const selected = fixture.nativeElement.querySelector('[aria-selected="true"]');
      expect(selected.id).toBe('city-tab-' + expected);
      expect(selected.tabIndex).toBe(0);
      expect(document.activeElement).toBe(selected);
    }
  });
  it('falls back once and handles even a missing default image gracefully', async () => {
    const fixture = await render();
    const img = fixture.nativeElement.querySelector('#city-panel-austin img');
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(img.getAttribute('src')).toBe('/assets/images/cities/default-hero.png');
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#city-panel-austin img')).toBeNull();
    expect(fixture.nativeElement.querySelector('#city-panel-austin').textContent).toContain('Austin');
  });
});
