import { afterNextRender, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import type { NewsItem, NewsResponse } from '../models/news';
import { CityContextService } from './city-context.service';

@Injectable({ providedIn: 'root' })
export class NewsService {
  readonly city = inject(CityContextService).selectedCity;
  readonly items = signal<NewsItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly stale = signal(false);
  private readonly ready = signal(false);
  private readonly cache = new Map<string, { data: NewsResponse; time: number }>();
  private controller?: AbortController;
  private request?: Promise<void>;
  private requestCity = '';
  constructor() {
    afterNextRender(() => this.ready.set(true));
    effect(() => {
      this.city();
      if (this.ready()) untracked(() => void this.load());
    });
    inject(DestroyRef).onDestroy(() => this.controller?.abort());
  }
  load(): Promise<void> {
    const city = this.city().key;
    if (this.request && this.requestCity === city) return this.request;
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.requestCity = city;
    this.items.set([]);
    this.stale.set(false);
    this.error.set('');
    const cached = this.cache.get(city);
    if (cached && Date.now() - cached.time < 15 * 60 * 1000) {
      this.items.set(cached.data.items);
      this.stale.set(cached.data.stale ?? false);
      this.loading.set(false);
      this.request = undefined;
      return Promise.resolve();
    }
    this.loading.set(true);
    this.request = this.fetchNews(city, controller);
    return this.request;
  }
  private async fetchNews(city: string, controller: AbortController): Promise<void> {
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/api/news?city=' + encodeURIComponent(city), { signal: controller.signal });
      if (!response.ok) throw new Error('News unavailable');
      const data: NewsResponse = await response.json();
      if (!Array.isArray(data.items)) throw new Error('Invalid response');
      if (this.controller !== controller || this.city().key !== city) return;
      this.cache.set(city, { data, time: Date.now() });
      this.items.set(data.items);
      this.stale.set(data.stale ?? false);
    } catch {
      if (this.controller === controller && this.city().key === city) this.error.set('News is temporarily unavailable. Please try again.');
    } finally {
      clearTimeout(timer);
      if (this.controller === controller) { this.loading.set(false); this.request = undefined; }
    }
  }
}
