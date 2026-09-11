import { fetchNewsItems, NewsConfigurationError } from './fetch-news';
interface NewsRequest { method?: string; }
interface NewsServerResponse { statusCode: number; setHeader(name: string, value: string): unknown; end(body: string): unknown; }
import type { NewsItem, NewsResponse } from '../../app/core/models/news';
const TTL = 15 * 60 * 1000;
let cache: { items: NewsItem[]; fetchedAt: number } | undefined;
let pending: Promise<NewsItem[]> | undefined;

export async function newsHandler(req: NewsRequest, res: NewsServerResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.statusCode = 405; res.setHeader('Allow', 'GET'); res.end(JSON.stringify({ error: 'Method not allowed', items: [] })); return; }
  let payload: NewsResponse;
  try {
    if (!cache || Date.now() - cache.fetchedAt > TTL) {
      pending ??= fetchNewsItems().then(items => { cache = { items, fetchedAt: Date.now() }; return items; }).finally(() => { pending = undefined; });
      await pending;
    }
    payload = { items: cache!.items };
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=900, stale-while-revalidate=60');
  } catch (error) {
    if (!(error instanceof NewsConfigurationError) && cache && Date.now() - cache.fetchedAt < 24 * 60 * 60 * 1000) payload = { items: cache.items, stale: true };
    else { res.statusCode = error instanceof NewsConfigurationError ? 500 : 503; payload = { items: [], error: 'News is temporarily unavailable.' }; }
    res.setHeader('Cache-Control', 'no-store');
  }
  res.end(JSON.stringify(payload));
}
