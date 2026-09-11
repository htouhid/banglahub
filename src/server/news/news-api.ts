interface NewsRequest { method?: string; }
interface NewsServerResponse { statusCode: number; setHeader(name: string, value: string): unknown; end(body: string): unknown; }
import type { NewsItem, NewsResponse } from '../../app/core/models/news';
import { DHAKA_TRIBUNE_FEED, normalizeDhakaTribune } from './dhaka-tribune';
const TTL = 15 * 60 * 1000;
let cache: { items: NewsItem[]; fetchedAt: number } | undefined;
let pending: Promise<NewsItem[]> | undefined;
async function fetchNews(): Promise<NewsItem[]> {
  const response = await fetch(DHAKA_TRIBUNE_FEED, { signal: AbortSignal.timeout(10000), headers: { Accept: 'application/rss+xml, application/xml' } });
  if (!response.ok) throw new Error('Publisher unavailable');
  const xml = await response.text();
  if (xml.length > 2_000_000) throw new Error('Feed too large');
  return normalizeDhakaTribune(xml);
}
export async function newsHandler(req: NewsRequest, res: NewsServerResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.statusCode = 405; res.setHeader('Allow', 'GET'); res.end(JSON.stringify({ error: 'Method not allowed', items: [] })); return; }
  let payload: NewsResponse;
  try {
    if (!cache || Date.now() - cache.fetchedAt > TTL) {
      pending ??= fetchNews().then(items => { cache = { items, fetchedAt: Date.now() }; return items; }).finally(() => { pending = undefined; });
      await pending;
    }
    payload = { items: cache!.items };
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=900, stale-while-revalidate=60');
  } catch {
    if (cache && Date.now() - cache.fetchedAt < 24 * 60 * 60 * 1000) payload = { items: cache.items, stale: true };
    else { res.statusCode = 503; payload = { items: [], error: 'News is temporarily unavailable. Please try again shortly.' }; }
    res.setHeader('Cache-Control', 'no-store');
  }
  res.end(JSON.stringify(payload));
}
