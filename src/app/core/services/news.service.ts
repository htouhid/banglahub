import { afterNextRender, Injectable, signal } from '@angular/core';
import type { NewsItem, NewsResponse } from '../models/news';

@Injectable({ providedIn: 'root' })
export class NewsService {
  readonly items = signal<NewsItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly stale = signal(false);
  private request?: Promise<void>;
  private loadedAt = 0;
  constructor() { afterNextRender(() => void this.load()); }
  load(): Promise<void> {
    if (this.request) return this.request;
    if (Date.now() - this.loadedAt < 15 * 60 * 1000) return Promise.resolve();
    this.loading.set(true);
    this.error.set('');
    this.request = this.fetchNews().finally(() => { this.loading.set(false); this.request = undefined; });
    return this.request;
  }
  private async fetchNews(): Promise<void> {
    try {
      const response = await fetch('/api/news', { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('News unavailable');
      const data: NewsResponse = await response.json();
      if (!Array.isArray(data.items)) throw new Error('Invalid response');
      this.items.set(data.items);
      this.stale.set(data.stale ?? false);
      this.loadedAt = Date.now();
    } catch { this.error.set('News is temporarily unavailable. Please try again.'); }
  }
}
