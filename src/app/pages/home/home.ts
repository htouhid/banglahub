import { Housing } from '../housing/housing';
import { ServicesPromo } from '../../shared/components/services-promo/services-promo';
import { CommunityJobsCarousel } from '../../shared/components/community-jobs-carousel/community-jobs-carousel';
import { CityHeroSlider } from '../../shared/components/city-hero-slider/city-hero-slider';
import { LocalWeatherComponent } from '../../shared/components/local-weather/local-weather';
import { LocalNewsComponent } from '../../shared/components/local-news/local-news';
import { DOCUMENT } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Restaurants } from '../local/restaurants/restaurants';
import { Groceries } from '../local/groceries/groceries';
import { afterNextRender, Component, computed, effect, inject, Injector, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [Housing, ServicesPromo, CommunityJobsCarousel, CityHeroSlider, LocalWeatherComponent, LocalNewsComponent, RouterLink, MatTabsModule, Restaurants, Groceries],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  private readonly keys = ['restaurants', 'groceries', 'services', 'events', 'jobs', 'rentals'];
  protected readonly active = computed(() => this.keys.indexOf(this.params().get('category') ?? ''));
  protected readonly visited = signal<ReadonlySet<number>>(new Set());
  constructor() {
    effect(() => {
      const index = this.active();
      if (index >= 0) this.visited.update(previous => new Set([...previous, index]));
    });
  }
  protected keySelect(event: Event): void {
    if ((event.target as HTMLElement).getAttribute('role') === 'tab') this.select(this.focused());
  }
  protected readonly focused = signal(0);
  protected select(index: number): void {
    if (index === this.active()) return;
    void this.router.navigate([], { relativeTo: this.route, queryParams: { category: this.keys[index] }, queryParamsHandling: 'merge' });
    afterNextRender(() => {
      const view = this.document.defaultView;
      const content = this.document.querySelector('.explore-tabs .mat-mdc-tab-body-active');
      if (view && content && content.getBoundingClientRect().top > view.innerHeight - 100) {
        content.scrollIntoView({ block: 'start', behavior: view.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      }
    }, { injector: this.injector });
  }
  protected changed(index: number): void {
    if (this.active() >= 0) this.select(index);
  }
  protected readonly categories = [
    { title: 'Restaurants', image: 'food', icon: '♨', description: 'A taste of home, around the corner.' },
    { title: 'Groceries', image: 'groceries', icon: '✿', description: 'Everyday essentials. Familiar flavors.' },
    { title: 'Services', image: 'services', icon: '⚒', description: 'Local hands you can count on.' },
    { title: 'Events', image: 'events', icon: '✦', description: 'Make memories with your people.' },
    { title: 'Jobs', image: 'jobs', icon: '↗', description: 'Find your next opportunity.' },
    { title: 'Rentals', image: 'rentals', icon: '⌂', description: 'Find a place to feel at home.' },
  ];
  protected readonly featured = [
    { title: 'The neighborhood kitchen', category: 'Restaurant', city: 'Queens, NY', image: 'food', description: 'Comforting curries, warm hospitality, and a seat at the table.' },
    { title: 'Your everyday bazaar', category: 'Groceries', city: 'Paterson, NJ', image: 'groceries', description: 'Fresh produce and pantry favorites for the recipes you love.' },
    { title: 'A community afternoon', category: 'Community event', city: 'Jersey City, NJ', image: 'events', description: 'An afternoon of conversation, culture, and new connections.' },
    { title: 'A new place to call home', category: 'Rentals', city: 'Brooklyn, NY', image: 'rentals', description: 'Imagine your next chapter in a neighborhood that feels familiar.' },
  ];
  protected readonly businessMessage = signal('');


}
