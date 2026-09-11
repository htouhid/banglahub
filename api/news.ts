import { fetchNewsItems, NewsConfigurationError } from '../src/server/news/fetch-news';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { NewsItem } from '../src/app/core/models/news';

const TTL = 15 * 60 * 1000;
let cache: { items: NewsItem[]; fetchedAt: number } | undefined;
let pending: Promise<NewsItem[]> | undefined;


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
      pending ??= fetchNewsItems().then(items => {
        cache = { items, fetchedAt: Date.now() };
        return items;
      }).finally(() => { pending = undefined; });
      await pending;
    }
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=900, stale-while-revalidate=60');
    res.status(200).json({ items: cache!.items });
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');
    if (!(error instanceof NewsConfigurationError) && cache && Date.now() - cache.fetchedAt < 24 * 60 * 60 * 1000) {
      res.status(200).json({ items: cache.items, stale: true });
    } else {
      res.status(error instanceof NewsConfigurationError ? 500 : 503).json({ items: [], error: 'News is temporarily unavailable.' });
    }
  }
}
