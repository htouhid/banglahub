import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DHAKA_TRIBUNE_FEED, normalizeDhakaTribune } from '../src/server/news/dhaka-tribune';
import type { NewsItem } from '../src/app/core/models/news';

const TTL = 15 * 60 * 1000;
let cache: { items: NewsItem[]; fetchedAt: number } | undefined;
let pending: Promise<NewsItem[]> | undefined;

async function fetchItems(): Promise<NewsItem[]> {
  const response = await fetch(DHAKA_TRIBUNE_FEED, {
    signal: AbortSignal.timeout(10000),
    headers: { Accept: 'application/rss+xml, application/xml' },
  });
  if (!response.ok) throw new Error('Publisher unavailable');
  const xml = await response.text();
  if (xml.length > 2_000_000) throw new Error('Feed too large');
  return normalizeDhakaTribune(xml);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Cache-Control', 'no-store');
    res.status(405).json({ items: [], error: 'Method not allowed' });
    return;
  }
  try {
    if (!cache || Date.now() - cache.fetchedAt > TTL) {
      pending ??= fetchItems().then(items => {
        cache = { items, fetchedAt: Date.now() };
        return items;
      }).finally(() => { pending = undefined; });
      await pending;
    }
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=900, stale-while-revalidate=60');
    res.status(200).json({ items: cache!.items });
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    if (cache && Date.now() - cache.fetchedAt < 24 * 60 * 60 * 1000) {
      res.status(200).json({ items: cache.items, stale: true });
    } else {
      res.status(503).json({ items: [], error: 'News is temporarily unavailable.' });
    }
  }
}
