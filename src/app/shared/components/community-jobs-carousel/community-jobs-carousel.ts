import { afterNextRender, Component, computed, DestroyRef, effect, ElementRef, inject, input, PendingTasks, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CityContextService } from '../../../core/services/city-context.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { CommunityJob, jobPay } from '../../../core/models/community-job';
import { CITY_OPTIONS } from '../../model/city-option.model';
@Component({ selector: 'app-community-jobs-carousel', imports: [DatePipe, RouterLink], templateUrl: './community-jobs-carousel.html', styleUrl: './community-jobs-carousel.scss' })
export class CommunityJobsCarousel {
  readonly standalonePage = input(false);
  readonly context = inject(CityContextService);
  readonly auth = inject(AuthStateService);
  readonly markets = CITY_OPTIONS;
  private readonly api = inject(SupabaseService);
  private readonly pending = inject(PendingTasks);
  private readonly destroy = inject(DestroyRef);
  private readonly ready = signal(false);
  readonly jobs = signal<CommunityJob[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly slots = computed(() => Array.from({length: Math.max(0, 3 - this.jobs().length)}, (_, i) => i));
  readonly pay = jobPay;
  private generation = 0;
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  constructor() {
    afterNextRender(() => this.ready.set(true));
    effect(() => {
      const city = this.context.selectedCity().name;
      if (this.ready()) void this.pending.run(() => this.load(city));
    });
  }
  async load(city = this.context.selectedCity().name): Promise<void> {
    const generation = ++this.generation;
    this.jobs.set([]); this.loading.set(true); this.error.set('');
    try {
      const rows = await this.api.getCommunityJobs(city);
      if (generation === this.generation && !this.destroy.destroyed) this.jobs.set(rows);
    } catch {
      if (generation === this.generation && !this.destroy.destroyed) this.error.set('Unable to load jobs. Please try again.');
    } finally {
      if (generation === this.generation && !this.destroy.destroyed) this.loading.set(false);
    }
  }
  move(direction: number): void {
    const el = this.track()?.nativeElement;
    if (el) el.scrollBy({left: direction * el.clientWidth, behavior: el.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  }
}
