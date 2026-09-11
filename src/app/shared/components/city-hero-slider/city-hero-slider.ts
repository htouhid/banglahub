import { Component, ElementRef, inject, signal, viewChildren } from '@angular/core';
import { CityContextService } from '../../../core/services/city-context.service';
import { CITY_OPTIONS, DEFAULT_CITY_IMAGE } from '../../model/city-option.model';

@Component({
  selector: 'app-city-hero-slider',
  templateUrl: './city-hero-slider.html',
  styleUrl: './city-hero-slider.scss',
})
export class CityHeroSlider {
  readonly context = inject(CityContextService);
  readonly cities = CITY_OPTIONS;
  readonly fallback = DEFAULT_CITY_IMAGE;
  readonly failed = signal<ReadonlySet<string>>(new Set());
  readonly unavailable = signal<ReadonlySet<string>>(new Set());
  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('cityButton');

  imageError(key: string): void {
    if (this.failed().has(key)) this.unavailable.update(values => new Set([...values, key]));
    else this.failed.update(values => new Set([...values, key]));
  }

  onKey(event: KeyboardEvent, index: number): void {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? this.cities.length - 1 :
      event.key === 'ArrowRight' ? (index + 1) % this.cities.length :
      event.key === 'ArrowLeft' ? (index + this.cities.length - 1) % this.cities.length : null;
    if (next === null) return;
    event.preventDefault();
    this.context.selectCity(this.cities[next].key);
    // Only runs for a browser keyboard event. Focus keeps the tab visible in the scroll row.
    this.buttons()[next]?.nativeElement.focus();
  }
}
