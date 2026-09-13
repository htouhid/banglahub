import { afterNextRender, Component, computed, DestroyRef, effect, inject, PendingTasks, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';
import { CityContextService } from '../../core/services/city-context.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { ServicePost } from '../../core/models/service-post';
import { CITY_OPTIONS } from '../../shared/model/city-option.model';
@Component({selector: 'app-services', imports: [RouterLink, CurrencyPipe, DatePipe], templateUrl: './services.html', styleUrl: './services.scss'})
export class Services {
  readonly auth = inject(AuthStateService);
  readonly context = inject(CityContextService);
  readonly markets = CITY_OPTIONS;
  private readonly api = inject(SupabaseService);
  private readonly pending = inject(PendingTasks);
  private readonly destroy = inject(DestroyRef);
  private readonly ready = signal(false);
  private generation = 0;
  readonly posts = signal<ServicePost[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly sections = computed(() => [
    {type: 'recommendation', heading: 'Community Recommendations', subtitle: 'Providers and services community members have personally used and shared.', action: '+ Share a Service', empty: 'No recommendations yet.', prompt: 'Used someone you trust? Share your experience and help the community.', posts: this.posts().filter(p => p.post_type === 'recommendation')},
    {type: 'request', heading: 'Help Requests', subtitle: 'Looking for someone reliable? Ask the community for recommendations or direct help.', action: '+ Ask the Community', empty: 'No open requests right now.', prompt: 'Need help finding someone reliable?', posts: this.posts().filter(p => p.post_type === 'request')},
  ]);
  readonly stars = [1,2,3,4,5];
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
      const rows = await this.api.getServicePosts(city);
      if (id === this.generation && !this.destroy.destroyed) this.posts.set(rows);
    } catch {
      if (id === this.generation && !this.destroy.destroyed) this.error.set('Unable to load community services. Please try again.');
    } finally {
      if (id === this.generation && !this.destroy.destroyed) this.loading.set(false);
    }
  }
}
