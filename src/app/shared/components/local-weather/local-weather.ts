import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, Component, computed, DestroyRef, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { WeatherService, type WeatherCoordinates, type WeatherReading } from '../../../core/services/weather.service';

@Component({ selector: 'app-local-weather', templateUrl: './local-weather.html', styleUrl: './local-weather.scss' })
export class LocalWeatherComponent {
  private readonly auth = inject(AuthStateService);
  private readonly service = inject(WeatherService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private readonly ready = signal(false);
  private readonly detectedLocation = signal<string | null>(null);
  private requestId = 0;
  private locationRequestId = 0;
  readonly weather = signal<WeatherReading | null>(null);
  readonly locating = signal(false);
  readonly loading = signal(true);
  readonly notice = signal('');
  readonly profileQuery = computed(() => {
    const profile = this.auth.profile();
    const city = profile?.city?.trim();
    const state = profile?.state?.trim();
    return this.auth.user() && city && state ? `${city}, ${state}` : 'Austin, TX';
  });
  readonly location = computed(() => this.detectedLocation() ?? this.profileQuery());
  constructor() {
    afterNextRender(() => this.ready.set(true));
    effect(() => {
      this.auth.user()?.id;
      this.profileQuery();
      this.locationRequestId++;
      this.detectedLocation.set(null);
      this.locating.set(false);
    });
    effect(() => {
      const query = this.profileQuery();
      if (this.browser && this.ready()) void this.load(query);
    });
  }
  private async load(query: string, coordinates?: WeatherCoordinates): Promise<void> {
    const id = ++this.requestId;
    this.loading.set(true); this.weather.set(null);
    try {
      const weather = await this.service.getWeather(query, coordinates);
      if (id === this.requestId && !this.destroyRef.destroyed) this.weather.set(weather);
    } catch { /* Quiet unavailable state; never show another city's weather. */ }
    finally { if (id === this.requestId && !this.destroyRef.destroyed) this.loading.set(false); }
  }
  protected useCurrentLocation(): void {
    if (!this.browser || this.locating()) return;
    if (!navigator.geolocation) { this.notice.set('Using your saved or default location.'); return; }
    const id = ++this.locationRequestId;
    this.locating.set(true); this.notice.set('');
    navigator.geolocation.getCurrentPosition(async position => {
      if (id !== this.locationRequestId || this.destroyRef.destroyed) return;
      // Invalidate an outstanding default-location forecast before resolving the device location.
      ++this.requestId;
      this.loading.set(true);
      this.weather.set(null);
      const coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      let label = 'Current location';
      try { label = await this.service.reverseGeocode(coordinates); }
      catch { /* Weather remains useful even when reverse geocoding is unavailable. */ }
      if (id !== this.locationRequestId || this.destroyRef.destroyed) return;
      this.detectedLocation.set(label);
      await this.load(this.profileQuery(), coordinates);
      if (id === this.locationRequestId && !this.destroyRef.destroyed) this.locating.set(false);
    }, () => {
      if (id !== this.locationRequestId || this.destroyRef.destroyed) return;
      this.locating.set(false); this.detectedLocation.set(null);
      this.notice.set('Using your saved or default location.');
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }
}
