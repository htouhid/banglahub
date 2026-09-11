import { describe, expect, it } from 'vitest';
import { normalizeDhakaTribune } from './dhaka-tribune';

describe('Dhaka Tribune RSS normalization', () => {
  it('sorts, deduplicates, caps items, strips markup, and omits full bodies', () => {
    const items = Array.from({ length: 20 }, (_, i) => `<item><title>Story ${i}</title><link>https://www.dhakatribune.com/news/${i}</link><pubDate>${new Date(Date.UTC(2026, 0, i + 1)).toUTCString()}</pubDate><description><![CDATA[<img src="https://example.com/a.jpg"/><p>${'excerpt '.repeat(60)}</p>]]></description><content:encoded>FULL BODY</content:encoded></item>`).join('');
    const news = normalizeDhakaTribune(`<rss><channel>${items}</channel></rss>`);
    expect(news).toHaveLength(15);
    expect(news[0].title).toBe('Story 19');
    expect(news[0].source).toBe('Dhaka Tribune');
    expect(news[0].summary!.length).toBeLessThanOrEqual(240);
    expect(JSON.stringify(news)).not.toContain('FULL BODY');
    expect(news[0].imageUrl).toBe('https://example.com/a.jpg');
  });
  it('rejects unsafe links and invalid feed formats', () => {
    expect(normalizeDhakaTribune('<rss><channel><item><title>X</title><link>javascript:alert(1)</link><pubDate>bad</pubDate></item></channel></rss>')).toEqual([]);
    expect(() => normalizeDhakaTribune('<html>Unavailable</html>')).toThrow();
  });
});
