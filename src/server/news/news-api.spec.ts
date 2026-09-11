import { afterEach, beforeEach, expect, it, vi } from 'vitest';

it('caches NewsAPI requests and returns normalized JSON', async () => {
  vi.resetModules();
  const fetcher = vi.fn().mockResolvedValue(Response.json({ status: 'ok', articles: [{ title: 'Headline', url: 'https://example.com/1', source: { name: 'Publisher' }, publishedAt: '2026-09-11T00:00:00Z' }] }));
  vi.stubGlobal('fetch', fetcher);
  const { newsHandler } = await import('./news-api');
  const response = () => ({ setHeader: vi.fn(), end: vi.fn(), statusCode: 200 });
  const first = response();
  await newsHandler({ method: 'GET' }, first);
  const second = response();
  await newsHandler({ method: 'GET' }, second);
  expect(fetcher).toHaveBeenCalledOnce();
  expect(JSON.parse(second.end.mock.calls[0][0]).items[0].source).toBe('Publisher');
  expect(second.setHeader).toHaveBeenCalledWith('Cache-Control', expect.stringContaining('s-maxage=900'));
});
it('returns a graceful uncached failure if the publisher is unavailable', async () => {
  vi.resetModules();
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
  const { newsHandler } = await import('./news-api');
  const res = { setHeader: vi.fn(), end: vi.fn(), statusCode: 200 };
  await newsHandler({ method: 'GET' }, res);
  expect(res.statusCode).toBe(503);
  expect(JSON.parse(res.end.mock.calls[0][0]).items).toEqual([]);
});
beforeEach(() => { vi.stubEnv('NEWS_API_KEY', 'test-key'); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
it('serves stale cache when NewsAPI fails after freshness expires', async () => {
  vi.resetModules();
  const clock = vi.spyOn(Date, 'now').mockReturnValue(1000000);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const fetcher = vi.fn().mockResolvedValue(Response.json({ status: 'ok', articles: [] }));
  vi.stubGlobal('fetch', fetcher);
  const { newsHandler } = await import('./news-api');
  const response = () => ({ setHeader: vi.fn(), end: vi.fn(), statusCode: 200 });
  await newsHandler({ method: 'GET' }, response());
  clock.mockReturnValue(1000000 + 16 * 60 * 1000);
  fetcher.mockRejectedValue(new Error('Blocked'));
  const stale = response();
  await newsHandler({ method: 'GET' }, stale);
  expect(stale.statusCode).toBe(200);
  expect(JSON.parse(stale.end.mock.calls[0][0]).stale).toBe(true);
  expect(fetcher).toHaveBeenCalledTimes(2);
  vi.restoreAllMocks();
});

it('returns a server error for missing configuration without leaking details', async () => {
  vi.resetModules(); vi.stubEnv('NEWS_API_KEY', '');
  const { newsHandler } = await import('./news-api');
  const res = { setHeader: vi.fn(), end: vi.fn(), statusCode: 200 };
  await newsHandler({ method: 'GET' }, res);
  expect(res.statusCode).toBe(500);
  expect(JSON.parse(res.end.mock.calls[0][0])).toEqual({ items: [], error: 'News is temporarily unavailable.' });
});
