import { afterEach, expect, it, vi } from 'vitest';
import { fetchNewsItems } from './fetch-news';
const html = '<html><title>Latest News</title><article><h2><a href="/bangladesh/123456/example">A publisher headline</a></h2><p>Short summary</p><time datetime="2026-09-11T00:00:00Z"></time></article></html>';
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it('uses RSS first without fetching HTML on success', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response('<rss><channel><title>News</title></channel></rss>'));
  vi.stubGlobal('fetch', fetcher);
  expect(await fetchNewsItems()).toEqual([]);
  expect(fetcher).toHaveBeenCalledOnce();
});
it('falls back to HTML after RSS failure and logs diagnostics', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const fetcher = vi.fn().mockResolvedValueOnce(new Response('Blocked', { status: 403 })).mockResolvedValueOnce(new Response(html));
  vi.stubGlobal('fetch', fetcher);
  const items = await fetchNewsItems();
  expect(items[0].title).toBe('A publisher headline');
  expect(items[0].summary).toBe('Short summary');
  expect(log).toHaveBeenCalledWith('NEWS_FETCH_FAILED', expect.objectContaining({ message: 'Upstream HTTP 403' }));
  expect(fetcher.mock.calls[1][0]).toContain('/latest-news');
});
