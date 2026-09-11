import { afterNextRender, Component, computed, inject, Injector, input, PendingTasks, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import type { ListingCategory, LocalListing } from '../../../core/models/local-listing';
import { ListingCard } from '../listing-card/listing-card';

@Component({
  selector: 'app-local-marketplace',
  imports: [ReactiveFormsModule, ListingCard],
  templateUrl: './marketplace.html',
  styleUrl: './marketplace.scss',
})
export class Marketplace {
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
    afterNextRender(() => this.pending.run(() => this.load()));
  }
  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.listings.set(await this.injector.get(SupabaseService).getListingsByCategory(this.category()));
    } catch {
      this.error.set('Unable to load listings. Please try again.');
    } finally { this.loading.set(false); }
  }
  protected search(): void {
    const value = this.form.getRawValue();
    this.filters.set({ query: value.query.trim().toLowerCase(), location: value.location.trim().toLowerCase() });
  }
}
