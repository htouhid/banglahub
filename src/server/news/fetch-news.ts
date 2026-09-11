/// <reference types="node" />
import { NEWS_QUERY, normalizeNewsApi } from './newsapi';
import type { NewsItem } from '../../app/core/models/news';

export class NewsConfigurationError extends Error {}
export async function fetchNewsItems(): Promise<NewsItem[]> {
  const key = process.env['NEWS_API_KEY']?.trim();
  if (!key) {
    console.error('NEWS_FETCH_FAILED', { message: 'NEWS_API_KEY is not configured' });
    throw new NewsConfigurationError('News API is not configured');
  }
  let status: number | undefined;
  try {
    const url = new URL('https://newsapi.org/v2/everything');
    url.search = new URLSearchParams({ q: NEWS_QUERY, language: 'en', sortBy: 'publishedAt', pageSize: '15' }).toString();
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), headers: { 'X-Api-Key': key, Accept: 'application/json' },
    });
    status = response.status;
    if (Number(response.headers.get('content-length')) > 2_000_000) throw new Error('Response too large');
    if (!response.body) throw new Error('Empty NewsAPI response');
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
      text += decoder.decode();
    } finally { reader.releaseLock(); }
    const data = JSON.parse(text) as { status?: string; message?: unknown };
    if (response.status !== 200 || data.status !== 'ok') {
      throw new Error(typeof data.message === 'string' ? data.message : 'NewsAPI request failed');
    }
    return normalizeNewsApi(data);
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).split(key).join('[REDACTED]').split(encodeURIComponent(key)).join('[REDACTED]').slice(0, 500);
    console.error('NEWS_FETCH_FAILED', { status, message });
    throw new Error('News is temporarily unavailable.');
  }
}
