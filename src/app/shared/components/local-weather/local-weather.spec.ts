import { CityContextService } from '../../../core/services/city-context.service';
import { signal, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { WeatherService } from '../../../core/services/weather.service';
import { LocalWeatherComponent } from './local-weather';

describe('Local weather location', () => {
  const user = signal<{ id: string } | null>({ id: 'member' });
  const profile = signal<{ city: string; state: string } | null>(null);
  const getWeather = vi.fn();
  const locate = vi.fn();
  const reverseGeocode = vi.fn();
  beforeEach(() => {
    sessionStorage.clear();
    user.set({ id: 'member' });
    profile.set({ city: ' Atlanta ', state: 'GA' });
    getWeather.mockReset().mockResolvedValue({ temperature: 72, condition: 'Partly cloudy', high: 80, low: 60, icon: '☁' });
    locate.mockReset();
    reverseGeocode.mockReset().mockResolvedValue('Atlanta, GA');
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: locate } });
    TestBed.configureTestingModule({ providers: [
      { provide: AuthStateService, useValue: { user, profile } },
      { provide: WeatherService, useValue: { getWeather, reverseGeocode } },
    ] });
  });
  afterEach(() => vi.unstubAllGlobals());
  async function render() {
    const fixture = TestBed.createComponent(LocalWeatherComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }
  it('uses the profile query and live reading without requesting geolocation', async () => {
    const fixture = await render();
    expect(getWeather).toHaveBeenCalledWith('Atlanta, GA', undefined);
    expect(fixture.nativeElement.textContent).toContain('Atlanta, GA');
    expect(fixture.nativeElement.textContent).toContain('72°F');
    expect(locate).not.toHaveBeenCalled();
  });
  it('reacts to restored profiles and falls back on logout or missing location', async () => {
    profile.set(null);
    const fixture = await render();
    expect(getWeather).toHaveBeenLastCalledWith('Austin, TX', undefined);
    profile.set({ city: 'Houston', state: 'TX' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getWeather).toHaveBeenLastCalledWith('Houston, TX', undefined);
    user.set(null);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getWeather).toHaveBeenLastCalledWith('Austin, TX', undefined);
  });
  it('reloads once per browsing city and leaves the saved profile unchanged', async () => {
    const fixture = await render();
    const context = TestBed.inject(CityContextService);
    for (const [key, query] of [['austin', 'Austin, TX'], ['dallas', 'Dallas, TX'], ['houston', 'Houston, TX'], ['chicago', 'Chicago, IL'], ['atlanta', 'Atlanta, GA']]) {
      const before = getWeather.mock.calls.length;
      context.selectCity(key);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(getWeather).toHaveBeenLastCalledWith(query, undefined);
      expect(getWeather).toHaveBeenCalledTimes(before + 1);
      expect(fixture.nativeElement.textContent).toContain(query);
      context.selectCity(key);
      fixture.detectChanges();
      expect(getWeather).toHaveBeenCalledTimes(before + 1);
    }
    expect(profile()).toEqual({ city: ' Atlanta ', state: 'GA' });
    expect(locate).not.toHaveBeenCalled();
    sessionStorage.clear();
  });
  it('requests coordinates only on click and uses them for weather', async () => {
    const fixture = await render();
    fixture.nativeElement.querySelector('button').click();
    expect(locate).toHaveBeenCalledOnce();
    await locate.mock.calls[0][0]({ coords: { latitude: 33.75, longitude: -84.39 } });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(getWeather).toHaveBeenLastCalledWith('Atlanta, GA', { latitude: 33.75, longitude: -84.39 });
    expect(fixture.nativeElement.textContent).toContain('Atlanta, GA');
    expect(reverseGeocode).toHaveBeenCalledWith({ latitude: 33.75, longitude: -84.39 });
  });
  it('still shows weather when reverse geocoding fails', async () => {
    reverseGeocode.mockRejectedValue(new Error('offline'));
    const fixture = await render();
    fixture.nativeElement.querySelector('button').click();
    await locate.mock.calls[0][0]({ coords: { latitude: 33.75, longitude: -84.39 } });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Current location');
    expect(fixture.nativeElement.textContent).toContain('72°F');
  });
  it('ignores a city lookup completed after the profile changes', async () => {
    let resolve!: (label: string) => void;
    reverseGeocode.mockReturnValue(new Promise<string>(done => resolve = done));
    const fixture = await render();
    fixture.nativeElement.querySelector('button').click();
    const pending = locate.mock.calls[0][0]({ coords: { latitude: 33.75, longitude: -84.39 } });
    profile.set({ city: 'Austin', state: 'TX' });
    fixture.detectChanges();
    await fixture.whenStable();
    resolve('Atlanta, GA');
    await pending;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Austin, TX');
    expect(getWeather).toHaveBeenLastCalledWith('Austin, TX', undefined);
  });
  it('keeps the profile location when permission is denied' , async () => {
    const fixture = await render();
    fixture.nativeElement.querySelector('button').click();
    locate.mock.calls[0][1]({ code: 1 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Atlanta, GA');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(getWeather).toHaveBeenCalledTimes(1);
  });
  it('does not use browser APIs on the server', async () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const fixture = await render();
    fixture.nativeElement.querySelector('button').click();
    expect(locate).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
  });
  it('shows an unavailable state instead of mock readings on failure', async () => {
    getWeather.mockRejectedValue(new Error('offline'));
    const fixture = await render();
    expect(fixture.nativeElement.textContent).toContain('Weather temporarily unavailable.');
  });
});
