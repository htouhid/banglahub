import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { News } from './news';
import { LocalNewsComponent } from '../../shared/components/local-news/local-news';
import { NewsService } from '../../core/services/news.service';
import type { NewsItem } from '../../core/models/news';

const item: NewsItem = { title: 'Test headline', source: 'Dhaka Tribune', url: 'https://www.dhakatribune.com/news/test', publishedAt: '2026-09-11T00:00:00Z', summary: 'Test summary' };
describe('News views', () => {
  const state = { items: signal<NewsItem[]>([]), loading: signal(false), error: signal(''), stale: signal(false), load: vi.fn() };
  beforeEach(() => {
    state.items.set([item]); state.loading.set(false); state.error.set('');
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: NewsService, useValue: state }] });
  });
  it('shows newest homepage story and links View All to news', () => {
    const fixture = TestBed.createComponent(LocalNewsComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Test headline');
    expect(fixture.nativeElement.querySelector('a[href="/news"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('h3 a').href).toBe(item.url);
  });
  it('renders returned articles with safe external links and loading/error/empty states', () => {
    const fixture = TestBed.createComponent(News); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Test summary');
    const link = fixture.nativeElement.querySelector('article a') as HTMLAnchorElement;
    expect(link.href).toBe(item.url); expect(link.target).toBe('_blank'); expect(link.rel).toBe('noopener noreferrer');
    state.loading.set(true); fixture.detectChanges(); expect(fixture.nativeElement.textContent).toContain('Loading latest');
    state.loading.set(false); state.error.set('Unavailable'); fixture.detectChanges(); expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    state.error.set(''); state.items.set([]); fixture.detectChanges(); expect(fixture.nativeElement.textContent).toContain('No headlines');
  });
});
