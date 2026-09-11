import { DHAKA_TRIBUNE_FEED, normalizeDhakaTribune } from './dhaka-tribune';
import { LATEST_NEWS_URL, normalizeLatestNews } from './latest-news';
import type { NewsItem } from '../../app/core/models/news';

async function fetchSource(url: string): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    headers: { 'User-Agent': 'Mozilla/5.0 BanglaHubNewsBot/1.0', Accept: 'application/rss+xml, application/xml, text/html' },
  });
  if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`);
  if (Number(response.headers.get('content-length')) > 2_000_000) throw new Error('Response too large');
  if (!response.body) throw new Error('Empty upstream response');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2_000_000) { await reader.cancel(); throw new Error('Response too large'); }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}
export async function fetchNewsItems(): Promise<NewsItem[]> {
  for (const source of [
    { url: DHAKA_TRIBUNE_FEED, parse: normalizeDhakaTribune },
    { url: LATEST_NEWS_URL, parse: normalizeLatestNews },
  ]) {
    try { return source.parse(await fetchSource(source.url)); }
    catch (error) {
      console.error('NEWS_FETCH_FAILED', { source: source.url, message: error instanceof Error ? error.message : String(error) });
    }
  }
  throw new Error('All news sources failed');
}
