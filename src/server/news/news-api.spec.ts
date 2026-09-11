import { afterEach, expect, it, vi } from 'vitest';

it('caches feed requests and returns normalized JSON', async () => {
  vi.resetModules();
  const fetcher = vi.fn().mockResolvedValue(new Response('<rss><channel><title>News</title><item><title>Headline</title><link>https://www.dhakatribune.com/news/1</link><pubDate>Fri, 11 Sep 2026 00:00:00 GMT</pubDate></item></channel></rss>'));
  vi.stubGlobal('fetch', fetcher);
  const { newsHandler } = await import('./news-api');
  const response = () => ({ setHeader: vi.fn(), end: vi.fn(), statusCode: 200 });
  const first = response();
  await newsHandler({ method: 'GET' }, first);
  const second = response();
  await newsHandler({ method: 'GET' }, second);
  expect(fetcher).toHaveBeenCalledOnce();
  expect(JSON.parse(second.end.mock.calls[0][0]).items[0].source).toBe('Dhaka Tribune');
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
afterEach(() => vi.unstubAllGlobals());
it('serves stale cache when both sources fail after freshness expires', async () => {
  vi.resetModules();
  const clock = vi.spyOn(Date, 'now').mockReturnValue(1000000);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const fetcher = vi.fn().mockResolvedValue(new Response('<rss><channel><title>News</title></channel></rss>'));
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
  expect(fetcher).toHaveBeenCalledTimes(3);
  vi.restoreAllMocks();
});
