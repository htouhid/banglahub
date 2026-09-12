import { LocalListingSlider } from '../../../shared/components/local-listing-slider/local-listing-slider';
import { afterNextRender, Component, computed, DestroyRef, effect, untracked, inject, Injector, input, PendingTasks, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import type { ListingCategory, LocalListing } from '../../../core/models/local-listing';
import type { CityOption } from '../../../shared/model/city-option.model';
import { ListingCard } from '../listing-card/listing-card';

@Component({
  selector: 'app-local-marketplace',
  imports: [ReactiveFormsModule, ListingCard, LocalListingSlider],
  templateUrl: './marketplace.html',
  styleUrl: './marketplace.scss',
})
export class Marketplace {
  readonly city = input<CityOption>();
  private readonly ready = signal(false);
  private readonly destroyRef = inject(DestroyRef);
  private requestId = 0;
  readonly category = input.required<ListingCategory>();
  readonly heading = input.required<string>();
  readonly description = input.required<string>();
  private readonly injector = inject(Injector);
  private readonly pending = inject(PendingTasks);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  private readonly listings = signal<LocalListing[]>([]);
  private readonly filters = signal({ query: '', location: '' });
  protected readonly form = inject(FormBuilder).nonNullable.group({ query: '', location: '' });
  protected readonly visible = computed(() => {
    const { query, location } = this.filters();
    return this.listings().filter(item => `${item.title} ${item.brief_review ?? ''}`.toLowerCase().includes(query)
      && `${item.address} ${item.city}, ${item.state}`.toLowerCase().includes(location));
  });
  constructor() {
    afterNextRender(() => this.ready.set(true));
    effect(() => {
      this.category(); this.city();
      if (this.ready()) untracked(() => {
        this.form.reset();
        this.filters.set({ query: '', location: '' });
        void this.pending.run(() => this.load());
      });
    });
  }
  protected async load(): Promise<void> {
    const id = ++this.requestId;
    const city = this.city();
    this.listings.set([]);
    this.loading.set(true);
    this.error.set('');
    try {
      const api = this.injector.get(SupabaseService);
      const rows = city ? await api.getListingsByCategory(this.category(), city.name, city.state)
        : await api.getListingsByCategory(this.category());
      if (id === this.requestId && !this.destroyRef.destroyed) {
        this.listings.set(city ? rows.filter(row =>
          row.market_city?.trim().toLowerCase() === city.name.toLowerCase() &&
          row.state.trim().toUpperCase() === city.state.toUpperCase()) : rows);
      }
    } catch {
      if (id === this.requestId && !this.destroyRef.destroyed) this.error.set('Unable to load listings. Please try again.');
    } finally { if (id === this.requestId && !this.destroyRef.destroyed) this.loading.set(false); }
  }
  protected search(): void {
    const value = this.form.getRawValue();
    this.filters.set({ query: value.query.trim().toLowerCase(), location: value.location.trim().toLowerCase() });
  }
}
