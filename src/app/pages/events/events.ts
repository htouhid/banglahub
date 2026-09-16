import { afterNextRender, Component, computed, DestroyRef, effect, inject, input, PendingTasks, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CityContextService } from '../../core/services/city-context.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { CommunityEvent } from '../../core/models/community-event';
import { CITY_OPTIONS } from '../../shared/model/city-option.model';
import { EventCard } from './event-card';
@Component({selector:'app-events', imports:[RouterLink,EventCard],templateUrl:'./events.html',styleUrl:'./events.scss'})
export class Events {
  readonly embedded = input(false);
  readonly context = inject(CityContextService);
  readonly markets = CITY_OPTIONS;
  readonly categories = ['All','Community','Cultural','Music','Food','Family','Sports','Festival','Free'];
  readonly category = signal('All');
  readonly events = signal<CommunityEvent[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  private readonly ready = signal(false);
  private readonly api = inject(SupabaseService);
  private readonly pending = inject(PendingTasks);
  private readonly destroy = inject(DestroyRef);
  private generation = 0;
  readonly visible = computed(() => this.events().filter(event => this.category() === 'All' ||
    (this.category() === 'Free' ? event.admission_type?.toLowerCase() === 'free' : event.category.toLowerCase() === this.category().toLowerCase())));
  constructor() {
    afterNextRender(() => this.ready.set(true));
    effect(() => {
      const city = this.context.selectedCity().name;
      if (this.ready()) void this.pending.run(() => this.load(city));
    });
  }
  async load(city = this.context.selectedCity().name): Promise<void> {
    const id = ++this.generation;
    this.events.set([]);this.loading.set(true);this.error.set('');
    try {
      const rows = await this.api.getCommunityEvents(city);
      if (id === this.generation && !this.destroy.destroyed) this.events.set(rows);
    } catch { if(id === this.generation && !this.destroy.destroyed) this.error.set('Unable to load events. Please try again.'); }
    finally { if(id === this.generation && !this.destroy.destroyed) this.loading.set(false); }
  }
}
