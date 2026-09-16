import { Component, computed, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommunityEvent } from '../../core/models/community-event';
@Component({
  selector: 'app-event-visual', imports: [MatIconModule],
  template: `@if (image() && failed() !== image()) {
    <img [src]="image()" [alt]="event().title" width="600" height="360" [loading]="hero() ? 'eager' : 'lazy'" (error)="failed.set(image())">
  } @else {
    <div class="fallback" [class.music]="event().category.toLowerCase() === 'music'">
      <mat-icon aria-hidden="true"><svg viewBox="0 0 24 24"><path [attr.d]="icon()"/></svg></mat-icon>
      <span>{{ event().category }}</span>
    </div>
  }`,
  styles: `:host{display:block;aspect-ratio:5/3;overflow:hidden;background:#faf0e8}img{width:100%;height:100%;object-fit:cover;display:block}.fallback{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:radial-gradient(circle at 15% 10%,#ffe3db,transparent 60%),linear-gradient(130deg,#faf7f2,#f5d9d5);color:#a9151c}.music{background:linear-gradient(120deg,#f4e5ee,#f5d9d5)}mat-icon{width:52px;height:52px}svg{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}span{font-weight:700;text-transform:capitalize}`,
})
export class EventVisual {
  readonly event = input.required<CommunityEvent>();
  readonly hero = input(false);
  readonly failed = signal<string | null>(null);
  // Image sources may be site-relative. Do not apply the absolute external-link validator.
  readonly image = computed(() => this.event().image_url?.trim() || null);
  readonly icon = computed(() => {
    const paths: Record<string,string> = {
      family: 'M6 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4M18 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4M2 15v-4c0-4 8-4 8 0M14 11c0-4 8-4 8 0v4M4 13v9m4-9v9m8-9v9m4-9v9M9 22v-5c0-3 6-3 6 0v5',
      music: 'M9 18V5l11-2v13M9 8l11-2M9 18c0 3-6 3-6 0s6-3 6 0M20 16c0 3-6 3-6 0s6-3 6 0',
      food: 'M5 3v7m3-7v7m3-7v7M5 8h6v3H8v10M19 3c-4 3-4 8 0 8V3m0 8v10',
      sports: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 7l5 4-2 6H9l-2-6 5-4M12 2v5m10 5-5-1M2 12l5-1m0 9 2-3m8 3-2-3',
      festival: 'M3 21 7 8l9 9-13 4M10 4l1-2m5 6 4-3m-1 8 3 1M7 12l5 5',
    };
    return paths[this.event().category.toLowerCase()] ?? 'M8 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6M16 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6M2 21v-4c0-6 12-6 12 0v4M14 13c5-1 8 1 8 5v3';
  });
}
