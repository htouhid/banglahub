import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { NewsItem } from '../../app/core/models/news';

export const DHAKA_TRIBUNE_FEED = 'https://www.dhakatribune.com/feed/';
const text = (value: unknown): string => typeof value === 'string' ? value : '';
function clean(value: unknown): string {
  return text(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|amp|quot|apos|rsquo|lsquo|rdquo|ldquo);/g, entity => ({ '&nbsp;': ' ', '&amp;': '&', '&quot;': '"', '&apos;': "'", '&rsquo;': '’', '&lsquo;': '‘', '&rdquo;': '”', '&ldquo;': '“' })[entity] ?? '')
    .replace(/\s+/g, ' ').trim();
}
function safeUrl(value: string, article = false): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return undefined;
    if (article && !['dhakatribune.com', 'www.dhakatribune.com'].includes(url.hostname)) return undefined;
    return url.href;
  } catch { return undefined; }
}
export function normalizeDhakaTribune(xml: string): NewsItem[] {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true) throw new Error('Invalid feed');
  const parsed = new XMLParser({ ignoreAttributes: false, parseTagValue: false }).parse(xml);
  if (!parsed?.rss?.channel) throw new Error('Expected RSS feed');
  const raw = parsed.rss.channel.item;
  const entries: unknown[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const items = new Map<string, NewsItem>();
  for (const value of entries) {
    if (!value || typeof value !== 'object') continue;
    const entry = value as Record<string, unknown>;
    const title = clean(entry['title']).slice(0, 300);
    const url = safeUrl(text(entry['link']), true);
    const date = Date.parse(text(entry['pubDate']));
    if (!title || !url || !Number.isFinite(date)) continue;
    const description = text(entry['description']);
    const summary = clean(description).replace(/\s*Details\s*$/, '').slice(0, 240);
    const imageUrl = safeUrl(description.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1] ?? '');
    const category = clean(Array.isArray(entry['category']) ? entry['category'][0] : entry['category']);
    items.set(url, { title, source: 'Dhaka Tribune', url, publishedAt: new Date(date).toISOString(),
      ...(summary ? { summary } : {}), ...(category ? { category } : {}), ...(imageUrl ? { imageUrl } : {}) });
  }
  return [...items.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 15);
}
