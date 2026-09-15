import { afterNextRender, Component, computed, DestroyRef, effect, inject, input, PendingTasks, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';
import { CityContextService } from '../../core/services/city-context.service';
import { SupabaseService } from '../../core/services/supabase.service';
import type { HousingPost } from '../../core/models/housing';
import { MatIconModule } from '@angular/material/icon';
import { CITY_OPTIONS } from '../../shared/model/city-option.model';
@Component({selector: 'app-housing', imports: [MatIconModule, RouterLink, CurrencyPipe, DatePipe], templateUrl: './housing.html', styleUrl: './housing.scss'})
export class Housing {
  readonly embedded = input(false);
  readonly auth = inject(AuthStateService);
  readonly context = inject(CityContextService);
  readonly markets = CITY_OPTIONS;
  private readonly api = inject(SupabaseService);
  private readonly pending = inject(PendingTasks);
  private readonly destroy = inject(DestroyRef);
  private readonly ready = signal(false);
  private generation = 0;
  readonly posts = signal<HousingPost[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly sections = computed(() => [
    {type: 'listing', heading: 'Available Homes & Rentals', subtitle: 'Homes, apartments, rooms, and properties shared by realtors, property owners, and community members.', action: '+ Post a Property', empty: 'No properties posted yet.', prompt: 'Have a home, apartment, or room available?', posts: this.posts().filter(p => p.post_type === 'listing')},
    {type: 'wanted', heading: 'Looking for a Place', subtitle: 'Community members searching for a home, apartment, room, or rental in the area.', action: '+ Post Housing Need', empty: 'No housing requests yet.', prompt: 'Searching for a place? Let the community know what you need.', posts: this.posts().filter(p => p.post_type === 'wanted')},
  ]);
  constructor() {
    afterNextRender(() => this.ready.set(true));
    effect(() => {
      const city = this.context.selectedCity().name;
      if (this.ready()) void this.pending.run(() => this.load(city));
    });
  }
  async load(city = this.context.selectedCity().name): Promise<void> {
    const id = ++this.generation;
    this.loading.set(true); this.error.set(''); this.posts.set([]);
    try {
      const rows = await this.api.getHousingPosts(city);
      if (id === this.generation && !this.destroy.destroyed) this.posts.set(rows);
    } catch {
      if (id === this.generation && !this.destroy.destroyed) this.error.set('Unable to load housing posts. Please try again.');
    } finally {
      if (id === this.generation && !this.destroy.destroyed) this.loading.set(false);
    }
  }
}
