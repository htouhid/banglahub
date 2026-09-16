import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { SeoService } from './seo.service';
import { CommunityEvent } from '../models/community-event';

describe('SEO document metadata', () => {
  let seo: SeoService;
  let doc: Document;
  beforeEach(() => { TestBed.configureTestingModule({}); seo = TestBed.inject(SeoService); doc = TestBed.inject(DOCUMENT); });
  const event = {
    id: 'test-event', title: 'Community Festival', short_description: '<b>Celebrate</b> together.',
    start_date: '2026-10-09', start_time: '18:30:00', end_date: '2026-10-11', end_time: null,
    city: 'Austin', state: 'TX', venue_name: 'Community Hall', image_url: '/images/events/test.jpg',
  } as CommunityEvent;
  it('renders homepage canonical, metadata and factual structured data', () => {
    seo.page('/');
    expect(doc.title).toBe('BanglaHub | Bangladeshi Community in the USA');
    expect(doc.querySelector('link[rel=canonical]')?.getAttribute('href')).toBe('https://bangla-hub.com/');
    const data = JSON.parse(doc.querySelector('script[data-banglahub-seo]')!.textContent!);
    expect(data['@graph'].map((item: Record<string,string>) => item['@type'])).toEqual(['WebSite', 'Organization']);
  });
  it('maps all requested public canonicals and existing category redirects', () => {
    for (const path of ['/events','/jobs','/housing','/services','/local/restaurants','/local/groceries','/about','/contact','/privacy','/terms']) {
      seo.page(path);
      expect(doc.querySelector('link[rel=canonical]')?.getAttribute('href')).toBe('https://bangla-hub.com'+path);
      expect(doc.querySelector('meta[name=robots]')?.getAttribute('content')).toBe('index, follow');
    }
    seo.page('/?category=restaurants');
    expect(doc.querySelector('link[rel=canonical]')?.getAttribute('href')).toBe('https://bangla-hub.com/local/restaurants');
  });
  it('creates self-canonical event metadata without converting venue-local dates', () => {
    seo.setEvent(event);
    expect(doc.title).toBe('Community Festival | BanglaHub');
    expect(doc.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://bangla-hub.com/images/events/test.jpg');
    const data = JSON.parse(doc.querySelector('script[data-banglahub-seo]')!.textContent!);
    expect(data.startDate).toBe('2026-10-09T18:30:00');
    expect(data.endDate).toBe('2026-10-11');
    expect(data.description).toBe('Celebrate together.');
    expect(data.url).toBe('https://bangla-hub.com/events/test-event');
  });
  it('removes stale image/JSON-LD and resets noindex across navigation', () => {
    seo.setEvent(event); seo.page('/jobs');
    expect(doc.querySelector('meta[property="og:image"]')).toBeNull();
    expect(doc.querySelector('script[data-banglahub-seo]')).toBeNull();
    for (const path of ['/admin','/admin/events/new','/account','/sign-in','/sign-up']) {
      seo.page(path); expect(doc.querySelector('meta[name=robots]')?.getAttribute('content')).toBe('noindex, nofollow');
    }
    seo.page('/');
    expect(doc.querySelector('meta[name=robots]')?.getAttribute('content')).toBe('index, follow');
    expect(doc.querySelectorAll('link[rel=canonical]').length).toBe(1);
    expect(doc.querySelectorAll('script[data-banglahub-seo]').length).toBe(1);
  });
  it('omits unsafe images and escapes JSON-LD script content', () => {
    seo.setEvent({...event, image_url: 'javascript:alert(1)', title: '</script><script>alert(1)</script>'});
    expect(doc.querySelector('meta[property="og:image"]')).toBeNull();
    expect(doc.querySelector('script[data-banglahub-seo]')!.textContent).not.toContain('</script>');
  });
});
