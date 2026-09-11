import { parse } from 'node-html-parser';
import type { NewsItem } from '../../app/core/models/news';
export const LATEST_NEWS_URL = 'https://www.dhakatribune.com/latest-news';
export function normalizeLatestNews(html: string, now = Date.now()): NewsItem[] {
  const root = parse(html);
  if (/just a moment|access denied/i.test(root.querySelector('title')?.text ?? '')) throw new Error('Publisher challenge page');
  const items = new Map<string, NewsItem>();
  for (const link of root.querySelectorAll('a[href]')) {
    let url: URL;
    try { url = new URL(link.getAttribute('href')!, LATEST_NEWS_URL); } catch { continue; }
    if (url.protocol !== 'https:' || !['www.dhakatribune.com', 'dhakatribune.com'].includes(url.hostname) || !/\/\d{5,}\//.test(url.pathname)) continue;
    const heading = link.querySelector('h2, h3, h4') ?? (link.parentNode?.tagName?.match(/^H[234]$/) ? link.parentNode : null);
    const title = (heading?.text ?? link.getAttribute('title') ?? link.text).replace(/\s+/g, ' ').trim();
    if (title.length < 12 || title.length > 300 || items.has(url.href)) continue;
    const card = link.closest('article') ?? link.closest('.each') ?? link.closest('.news-item') ?? link.parentNode;
    const time = card?.querySelector('time, .time, .published-time, .publish-time');
    const rawDate = time?.getAttribute('datetime') ?? time?.text.trim() ?? '';
    const relative = rawDate.match(/(\d+)\s*(minute|hour|day)s?\s*ago/i);
    const timestamp = relative ? now - Number(relative[1]) * ({ minute: 60000, hour: 3600000, day: 86400000 }[relative[2].toLowerCase()] ?? 0) : Date.parse(rawDate);
    const summary = card?.querySelector('.summary, .excerpt, .intro, p')?.text.replace(/\s+/g, ' ').trim().slice(0, 240);
    items.set(url.href, { title, source: 'Dhaka Tribune', url: url.href,
      // An empty date means the listing supplied no publication time; never invent one.
      publishedAt: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : '',
      ...(summary ? { summary } : {}),
    });
  }
  if (!items.size) throw new Error('No article links found in latest-news page');
  return [...items.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 15);
}
