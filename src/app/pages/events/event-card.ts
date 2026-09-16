import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CommunityEvent, eventTime } from '../../core/models/community-event';
import { EventVisual } from './event-visual';
@Component({
  selector: 'app-event-card', imports: [DatePipe, RouterLink, EventVisual],
  template: `<a [routerLink]="['/events', event().id]" [attr.aria-label]="'View event: ' + event().title">
    <div class="visual"><app-event-visual [event]="event()" /><time class="date" [attr.datetime]="event().start_date">{{ event().start_date | date:'MMM d':'UTC' }}</time></div>
    <div class="copy"><span class="category">{{ event().category }}</span>
      @if (event().admission_type?.toLowerCase() === 'free') { <span class="badge">Free</span> }
      @if (event().is_featured) { <span class="badge">Featured</span> }
      <h3>{{ event().title }}</h3>@if (event().venue_name) { <p>{{ event().venue_name }}</p> }
      <p>{{ event().city }}, {{ event().state }}</p>@if (event().start_time) { <p>{{ time(event().start_time) }}</p> }
    </div></a>`,
  styles: `:host{display:flex;min-width:0}a{display:flex;flex-direction:column;width:100%;box-sizing:border-box;border:1px solid #e2e2e2;border-radius:20px;overflow:hidden;text-decoration:none;color:#222;background:white;box-shadow:0 5px 18px #30251909}a{transition:box-shadow 180ms,border-color 180ms}a:hover{border-color:#d91b24;box-shadow:0 10px 26px #30251920}app-event-visual{aspect-ratio:2/1}.copy{flex:1}@media(prefers-reduced-motion:reduce){a{transition:none}}a:focus-visible{outline:3px solid #a9151c;outline-offset:3px}.visual{position:relative}.date{position:absolute;bottom:12px;left:12px;background:white;border-radius:9px;padding:9px;font-weight:700}.copy{padding:22px}h3{font-size:20px;line-height:1.3;margin:14px 0;overflow-wrap:anywhere}p{font-size:13px;color:#666;margin:7px 0}.category{color:#a9151c;text-transform:capitalize;font-size:12px;font-weight:700}.badge{display:inline-block;background:#faf0e8;margin-left:8px;padding:4px 7px;border-radius:12px;font-size:11px}`,
})
export class EventCard {
  readonly event = input.required<CommunityEvent>();
  readonly time = eventTime;
}
