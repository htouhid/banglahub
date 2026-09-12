import type { NewsItem } from '../../app/core/models/news';
export const CITY_NEWS_QUERIES = {
  austin: '("Austin" OR "Central Texas")',
  dallas: '("Dallas" OR "DFW" OR "North Texas")',
  houston: '("Houston" OR "Greater Houston")',
  chicago: '("Chicago" OR "Chicagoland")',
  atlanta: '("Atlanta" OR "Metro Atlanta")',
} as const;
export type NewsCity = keyof typeof CITY_NEWS_QUERIES;
export function newsCity(value: unknown): NewsCity {
  const key = typeof value === 'string' ? value.toLowerCase() : '';
  return Object.hasOwn(CITY_NEWS_QUERIES, key) ? key as NewsCity : 'austin';
}
export const NEWS_QUERY = CITY_NEWS_QUERIES.austin;
const text = (value: unknown): string => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
function url(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const parsed = new URL(value);
    return ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password ? parsed.href : undefined;
  } catch { return undefined; }
}
export function normalizeNewsApi(value: unknown): NewsItem[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { articles?: unknown }).articles)) throw new Error('Invalid NewsAPI response');
  const items = new Map<string, NewsItem>();
  for (const raw of (value as { articles: unknown[] }).articles) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    const title = text(item['title']);
    const articleUrl = url(item['url']);
    if (!title || title === '[Removed]' || !articleUrl) continue;
    const source = item['source'] as { name?: unknown } | null;
    const timestamp = Date.parse(text(item['publishedAt']));
    const summary = text(item['description']).slice(0, 240);
    const imageUrl = url(item['urlToImage']);
    items.set(articleUrl, { title: title.slice(0, 300), source: text(source?.name) || new URL(articleUrl).hostname,
      url: articleUrl, publishedAt: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : '',
      ...(summary ? { summary } : {}), ...(imageUrl ? { imageUrl } : {}),
    });
  }
  return [...items.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 20);
}
