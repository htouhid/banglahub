import { TestBed } from '@angular/core/testing';
import { EventVisual } from './event-visual';
import type { CommunityEvent } from '../../core/models/community-event';

describe('EventVisual image sources', () => {
  function render(image_url: string | null) {
    const fixture = TestBed.createComponent(EventVisual);
    fixture.componentRef.setInput('event', { title: 'Shreya Ghoshal', category: 'Music', image_url } as CommunityEvent);
    fixture.detectChanges();
    return fixture;
  }
  it.each(['/images/events/shreya-ghoshal-austin-2026.jpg', 'images/events/concert.jpg', 'https://example.com/event.jpg'])('renders image source unchanged: %s', source => {
    const fixture = render(source);
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe(source);
    expect(fixture.nativeElement.querySelector('.fallback')).toBeNull();
  });
  it.each([null, '', '   '])('uses fallback for an empty source: %s', source => {
    const fixture = render(source);
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.fallback')).toBeTruthy();
  });
  it('falls back on a real load error and retries when the URL changes', () => {
    const fixture = render('/images/first.jpg');
    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.fallback')).toBeTruthy();
    fixture.componentRef.setInput('event', { title: 'Other event', category: 'Music', image_url: '/images/second.jpg' } as CommunityEvent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('/images/second.jpg');
  });
});
