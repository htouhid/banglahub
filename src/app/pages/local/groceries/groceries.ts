import { RouterLink } from '@angular/router';
import { AuthStateService } from '../../../core/services/auth-state.service';
import type { LocalRating } from '../../../core/models/local-rating';
import { afterNextRender, Component, computed, DestroyRef, effect, ElementRef, inject, PendingTasks, signal, viewChild } from '@angular/core';
import { CityContextService } from '../../../core/services/city-context.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import type { LocalListing } from '../../../core/models/local-listing';

@Component({
  selector: 'app-groceries',
  imports: [RouterLink],
  templateUrl: './groceries.html',
  styleUrl: './groceries.scss',
})
export class Groceries {
  readonly auth = inject(AuthStateService);
  readonly stars = [1, 2, 3, 4, 5];
  readonly ratings = signal<LocalRating[]>([]);
  readonly ratingsLoading = signal(false);
  readonly ratingsError = signal('');
  readonly saving = signal<ReadonlySet<string>>(new Set());
  readonly messages = signal<Record<string, string>>({});
  readonly failures = signal<Record<string, string>>({});
  readonly hover = signal<{id: string; value: number} | null>(null);
  readonly summaries = computed(() => {
    const map: Record<string, { count: number; average: number; filled: number; mine: number }> = {};
    for (const row of this.ratings()) {
      const entry = map[row.listing_id] ??= {count: 0, average: 0, filled: 0, mine: 0};
      entry.count++; entry.average += row.rating;
      if (row.user_id === this.auth.user()?.id) entry.mine = row.rating;
    }
    for (const entry of Object.values(map)) { entry.average /= entry.count; entry.filled = Math.round(entry.average); }
    return map;
  });
  summary(id: string) { return this.summaries()[id] ?? {count: 0, average: 0, filled: 0, mine: 0}; }
  async rate(id: string, value: number): Promise<void> {
    if (!this.auth.user() || this.saving().has(id) || this.ratingsLoading() || this.ratingsError()) return;
    const generation = this.requestId;
    this.saving.update(set => new Set([...set, id]));
    this.failures.update(items => ({...items, [id]: ''}));
    this.messages.update(items => ({...items, [id]: ''}));
    try {
      const row = await this.api.saveRating(id, value);
      if (generation !== this.requestId || this.destroyRef.destroyed) return;
      this.ratings.update(rows => [...rows.filter(item => !(item.listing_id === row.listing_id && item.user_id === row.user_id)), row]);
      this.messages.update(items => ({...items, [id]: 'Rating saved.'}));
    } catch {
      if (generation === this.requestId && !this.destroyRef.destroyed) this.failures.update(items => ({...items, [id]: 'Unable to save rating. Please try again.'}));
    } finally {
      if (!this.destroyRef.destroyed) this.saving.update(set => new Set([...set].filter(key => key !== id)));
    }
  }
  async loadRatings(): Promise<void> {
    const generation = this.requestId;
    this.ratingsLoading.set(true); this.ratingsError.set('');
    try {
      const rows = await this.api.getRatings(this.listings().map(item => item.id));
      if (generation === this.requestId && !this.destroyRef.destroyed) this.ratings.set(rows);
    } catch {
      if (generation === this.requestId && !this.destroyRef.destroyed) this.ratingsError.set('Ratings are temporarily unavailable.');
    } finally {
      if (generation === this.requestId && !this.destroyRef.destroyed) this.ratingsLoading.set(false);
    }
  }
  readonly city = inject(CityContextService).selectedCity;
  private readonly api = inject(SupabaseService);
  private readonly pending = inject(PendingTasks);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ready = signal(false);
  private requestId = 0;
  readonly listings = signal<LocalListing[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');

  constructor() {
    afterNextRender(() => this.ready.set(true));
    effect(() => {
      const market = this.city().name;
      if (this.ready()) void this.pending.run(() => this.load(market));
    });
  }

  async load(market = this.city().name): Promise<void> {
    const id = ++this.requestId;
    this.ratings.set([]); this.messages.set({}); this.failures.set({}); this.hover.set(null);
    this.listings.set([]);
    this.loading.set(true);
    this.error.set('');
    try {
      const rows = await this.api.getGroceriesByMarket(market);
      if (id === this.requestId && !this.destroyRef.destroyed) {
        this.listings.set(rows);
        this.loading.set(false);
        await this.loadRatings();
      }
    } catch {
      if (id === this.requestId && !this.destroyRef.destroyed) this.error.set('Unable to load groceries. Please try again.');
    } finally {
      if (id === this.requestId && !this.destroyRef.destroyed) this.loading.set(false);
    }
  }

  tags(value: string | null | undefined): string[] {
    return [...new Set((value ?? '').split(/[,;|]/).map(tag => tag.trim()).filter(Boolean))];
  }

  move(direction: number): void {
    // Invoked only by an explicit browser click; no DOM access during SSR.
    const element = this.track()?.nativeElement;
    if (!element) return;
    const view = element.ownerDocument.defaultView;
    element.scrollBy({
      left: direction * element.clientWidth,
      behavior: view?.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }
}
