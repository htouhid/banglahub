import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { CommunityEvent } from '../models/community-event';

export const SEO_ORIGIN = 'https://bangla-hub.com';
const pages: Record<string, [string, string]> = {
  '/': ['BanglaHub | Bangladeshi Community in the USA', 'BanglaHub connects the Bangladeshi community across the United States. Discover local businesses, events, jobs, housing, services, and community resources.'],
  '/events': ['Bangladeshi Community Events | BanglaHub', 'Discover Bangladeshi community events, concerts, festivals, cultural programs, and local events across BanglaHub communities in the United States.'],
  '/jobs': ['Community Jobs & Referrals | BanglaHub', 'Discover jobs, referrals, and professional opportunities shared by BanglaHub community members across the United States.'],
  '/housing': ['Community Housing & Rentals | BanglaHub', "Find homes, rentals, and housing opportunities shared within the BanglaHub community, or let others know what you're looking for."],
  '/services': ['Community Recommended Services | BanglaHub', 'Find trusted service providers recommended by BanglaHub community members, share someone you trust, or ask the community for help.'],
  '/local/restaurants': ['Bangladeshi Restaurants | BanglaHub', 'Discover Bangladeshi restaurants and community dining recommendations in BanglaHub cities across the United States.'],
  '/local/groceries': ['Bangladeshi Grocery Stores | BanglaHub', 'Discover Bangladeshi and South Asian grocery stores serving BanglaHub communities across the United States.'],
  '/about': ['About BanglaHub | Building a Stronger Community', 'Learn about BanglaHub and our mission to connect, support, and strengthen the Bangladeshi community across the United States.'],
  '/contact': ['Contact BanglaHub', 'Contact BanglaHub with questions, suggestions, community information, or feedback.'],
  '/privacy': ['Privacy Policy | BanglaHub', 'Read the BanglaHub privacy policy.'],
  '/terms': ['Terms of Use | BanglaHub', 'Read the BanglaHub terms of use.'],
  '/news': ['Local Community News | BanglaHub', 'Read the latest local headlines from sources serving BanglaHub communities.'],
  '/businesses': ['Community Businesses | BanglaHub', 'Explore businesses serving BanglaHub communities.'],
  '/community': ['Our Community | BanglaHub', 'Connect with the BanglaHub community across the United States.'],
};
export interface PageSeo {
  title: string; description: string; path: string; noindex?: boolean;
  image?: string | null; ogTitle?: string; jsonLd?: object;
}
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private event: CommunityEvent | null = null;

  page(url: string, fallbackTitle = 'BanglaHub'): void {
    const parsed = new URL(url, SEO_ORIGIN);
    let path = parsed.pathname;
    const category = parsed.searchParams.get('category');
    if (path === '/' && (category === 'restaurants' || category === 'groceries')) path = `/local/${category}`;
    if (this.event && path === `/events/${this.event.id}`) { this.setEvent(this.event); return; }
    this.event = null;
    const values = pages[path];
    this.set({ title: values?.[0] ?? fallbackTitle, description: values?.[1] ?? 'BanglaHub community information.', path, noindex: !values,
      jsonLd: path === '/' ? { '@context': 'https://schema.org', '@graph': [
        { '@type': 'WebSite', name: 'BanglaHub', url: SEO_ORIGIN },
        { '@type': 'Organization', name: 'BanglaHub', url: SEO_ORIGIN },
      ] } : undefined });
  }

  setEvent(event: CommunityEvent): void {
    this.event = event;
    const description = this.text(event.short_description || event.description || `${event.title} in ${event.city}, ${event.state} on ${event.start_date}.`);
    const image = this.imageUrl(event.image_url);
    const path = `/events/${event.id}`;
    const localDate = (date: string, time: string | null) => date + (time ? `T${time}` : '');
    this.set({ title: `${event.title} | BanglaHub`, ogTitle: event.title, description, path, image,
      jsonLd: {
        '@context': 'https://schema.org', '@type': 'Event', name: event.title, description,
        url: SEO_ORIGIN + path, startDate: localDate(event.start_date, event.start_time),
        ...(event.end_date ? { endDate: localDate(event.end_date, event.end_time) } : {}),
        ...(image ? { image } : {}),
        location: { '@type': 'Place', ...(event.venue_name ? { name: event.venue_name } : {}), address: {
          '@type': 'PostalAddress', ...(event.address ? { streetAddress: event.address } : {}),
          addressLocality: event.city, addressRegion: event.state, addressCountry: 'US',
        } },
        ...(event.organizer_name ? { organizer: { '@type': 'Organization', name: event.organizer_name } } : {}),
      } });
  }

  set(page: PageSeo): void {
    const canonical = SEO_ORIGIN + new URL(page.path, SEO_ORIGIN).pathname;
    this.title.setTitle(page.title);
    this.meta.updateTag({ name: 'description', content: this.text(page.description) });
    this.meta.updateTag({ name: 'robots', content: page.noindex ? 'noindex, nofollow' : 'index, follow' });
    for (const [property, content] of Object.entries({ 'og:title': page.ogTitle ?? page.title, 'og:description': this.text(page.description), 'og:url': canonical, 'og:type': 'website', 'og:site_name': 'BanglaHub' })) {
      this.meta.updateTag({ property, content });
    }
    this.meta.removeTag('property="og:image"');
    if (page.image) this.meta.updateTag({ property: 'og:image', content: page.image });
    this.document.head.querySelectorAll('link[rel="canonical"]').forEach(node => node.remove());
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'canonical'); link.setAttribute('href', canonical); this.document.head.appendChild(link);
    this.document.head.querySelectorAll('script[data-banglahub-seo]').forEach(node => node.remove());
    if (page.jsonLd) {
      const script = this.document.createElement('script'); script.type = 'application/ld+json';
      script.setAttribute('data-banglahub-seo', '');
      script.textContent = JSON.stringify(page.jsonLd).replace(/</g, '\\u003c');
      this.document.head.appendChild(script);
    }
  }
  private text(value: string): string {
    const plain = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return plain.length > 170 ? plain.slice(0, 167).trimEnd() + '…' : plain;
  }
  private imageUrl(value: string | null): string | null {
    if (!value?.trim()) return null;
    try {
      const url = new URL(value.trim(), SEO_ORIGIN + '/');
      return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
    } catch { return null; }
  }
}
@Injectable()
export class SeoTitleStrategy extends TitleStrategy {
  private readonly seo = inject(SeoService);
  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.seo.page(snapshot.url, this.buildTitle(snapshot));
  }
}
