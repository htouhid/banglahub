import { Component, computed, input, linkedSignal, signal } from '@angular/core';
import type { LocalListing } from '../../../core/models/local-listing';
import { ListingCard } from '../../../pages/local/listing-card/listing-card';

@Component({
  selector: 'app-local-listing-slider',
  imports: [ListingCard],
  templateUrl: './local-listing-slider.html',
  styleUrl: './local-listing-slider.scss',
})
export class LocalListingSlider {
  readonly listings = input.required<LocalListing[]>();
  readonly selectedIndex = linkedSignal({ source: this.listings, computation: () => 0 });
  readonly selectedListing = computed(() => this.listings()[this.selectedIndex()] ?? null);
  protected readonly failedImages = signal<ReadonlySet<string>>(new Set());
  protected select(index: number, event?: Event): void {
    this.selectedIndex.set(index);
    // This handler only runs for browser interaction; no DOM access during SSR.
    const button = event?.currentTarget as HTMLElement | undefined;
    if (button) this.reveal(button);
  }
  protected selectorKey(event: KeyboardEvent, index: number): void {
    const length = this.listings().length;
    const next = event.key === 'ArrowRight' ? (index + 1) % length
      : event.key === 'ArrowLeft' ? (index - 1 + length) % length
      : event.key === 'Home' ? 0 : event.key === 'End' ? length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    this.selectedIndex.set(next);
    const button = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('button')[next];
    button?.focus({ preventScroll: true });
    if (button) this.reveal(button);
  }
  private reveal(button: HTMLElement): void {
    const parent = button.parentElement;
    if (!parent) return;
    const left = button.offsetLeft - parent.offsetLeft;
    if (left < parent.scrollLeft || left + button.offsetWidth > parent.scrollLeft + parent.clientWidth) {
      parent.scrollTo({ left: left - (parent.clientWidth - button.offsetWidth) / 2, behavior: button.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }
  protected move(delta: number, event: Event): void {
    const items = this.listings();
    if (!items.length) return;
    const next = (this.selectedIndex() + delta + items.length) % items.length;
    this.selectedIndex.set(next);
    const root = (event.currentTarget as HTMLElement).closest('.slider');
    const button = root?.querySelectorAll<HTMLElement>('.selector')[next];
    if (button) this.reveal(button);
  }
  protected imageError(id: string): void { this.failedImages.update(ids => new Set([...ids, id])); }
}
