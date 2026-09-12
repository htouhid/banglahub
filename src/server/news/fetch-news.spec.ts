import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { fetchNewsItems, NewsConfigurationError } from './fetch-news';
import { normalizeNewsApi } from './newsapi';
beforeEach(() => { vi.stubEnv('NEWS_API_KEY', 'test-key'); vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
it('requests NewsAPI with server-only header and city query', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ status: 'ok', articles: [{ title: 'Bangladesh headline', source: { name: 'Publisher' }, url: 'https://example.com/story', publishedAt: '2026-09-11T00:00:00Z', description: 'Excerpt', content: 'Do not expose' }] }));
  vi.stubGlobal('fetch', fetcher);
  const items = await fetchNewsItems();
  const [url, options] = fetcher.mock.calls[0];
  expect(url.searchParams.get('q')).toBe('("Austin" OR "Central Texas")');
  expect(url.searchParams.get('pageSize')).toBe('20');
  expect(options.headers['X-Api-Key']).toBe('test-key');
  expect(url.href).not.toContain('test-key');
  expect(items[0].source).toBe('Publisher');
  expect(JSON.stringify(items)).not.toContain('Do not expose');
});
it('fails clearly without a key and never fetches', async () => {
  vi.stubEnv('NEWS_API_KEY', '');
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
  await expect(fetchNewsItems()).rejects.toBeInstanceOf(NewsConfigurationError);
  expect(fetcher).not.toHaveBeenCalled();
});
it('logs upstream status and redacts keys from error messages', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'error', message: 'Invalid test-key' }, { status: 401 })));
  await expect(fetchNewsItems()).rejects.toThrow('News is temporarily unavailable.');
  expect(console.error).toHaveBeenCalledWith('NEWS_FETCH_FAILED', { status: 401, message: 'Invalid [REDACTED]' });
});
it('filters invalid articles, sorts, limits results and ignores content', () => {
  const articles = Array.from({ length: 20 }, (_, i) => ({ title: `Headline ${i}`, url: `https://example.com/${i}`, source: { name: 'Publisher' }, publishedAt: new Date(Date.UTC(2026, 0, i + 1)).toISOString(), content: 'PRIVATE BODY' }));
  const items = normalizeNewsApi({ articles: [...articles, { title: '', url: 'https://example.com/invalid' }, { title: 'Unsafe', url: 'javascript:alert(1)' }] });
  expect(items).toHaveLength(20); expect(items[0].title).toBe('Headline 19');
  expect(JSON.stringify(items)).not.toContain('PRIVATE BODY');
});
