import { afterNextRender, computed, inject, Injectable, signal } from '@angular/core';
import { AuthStateService } from './auth-state.service';
import { CITY_OPTIONS, DEFAULT_CITY, type CityOption } from '../../shared/model/city-option.model';

@Injectable({ providedIn: 'root' })
export class CityContextService {
  private readonly auth = inject(AuthStateService);
  private readonly choice = signal<CityOption | null>(null);
  private storage: Storage | null = null;
  readonly selectedCity = computed(() => {
    if (this.choice()) return this.choice()!;
    const profile = this.auth.user() ? this.auth.profile() : null;
    return CITY_OPTIONS.find(city =>
      city.name.toLowerCase() === profile?.city?.trim().toLowerCase() &&
      city.state === profile?.state?.trim().toUpperCase()
    ) ?? DEFAULT_CITY;
  });

  constructor() {
    afterNextRender(() => {
      try {
        this.storage = window.sessionStorage;
        const saved = this.storage.getItem('banglahub.city');
        if (!this.choice()) this.choice.set(CITY_OPTIONS.find(city => city.key === saved) ?? null);
      } catch { /* In-memory selection still works when storage is unavailable. */ }
    });
  }

  selectCity(key: string): void {
    const city = CITY_OPTIONS.find(option => option.key === key);
    if (!city) return;
    this.choice.set(city);
    try { this.storage?.setItem('banglahub.city', city.key); } catch { /* Optional persistence. */ }
  }
}
