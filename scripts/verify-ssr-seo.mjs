// Run against `npm run serve:ssr:banglahub`, never the Angular dev server.
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const origin = process.env['SSR_TEST_ORIGIN'] || 'http://localhost:4000';
const paths = ['/', '/events', '/jobs', '/housing', '/services', '/sign-in', '/sign-up', '/account', '/admin', '/admin/events'];
for (const path of paths) {
  const response = await fetch(origin + path, {
    headers: process.env['SSR_TEST_PROXY_HEADERS'] === '1' ? {
      'x-forwarded-for': '192.0.2.1',
      'x-forwarded-host': 'bangla-hub.com',
      'x-forwarded-proto': 'https',
    } : {},
  });
  assert.equal(response.status, 200, path);
  const html = await response.text();
  const doc = new JSDOM(html).window.document;
  const privatePage = /^\/(admin|account|sign-in|sign-up)(\/|$)/.test(path);
  const robots = doc.querySelectorAll('meta[name="robots"]');
  assert.equal(robots.length, 1, `${path}: exactly one robots tag`);
  assert.equal(robots[0].getAttribute('content'), privatePage ? 'noindex, nofollow' : 'index, follow', path);
  const rootRendered = !!doc.querySelector('app-root')?.children.length;
  if (!privatePage) {
    assert.ok(rootRendered, `${path}: app-root must be rendered`);
    assert.equal(doc.querySelectorAll('link[rel="canonical"]').length, 1);
    assert.equal(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'), 'https://bangla-hub.com' + path);
    assert.ok(doc.querySelector('meta[name="description"]')?.getAttribute('content'));
    for (const property of ['og:title', 'og:description', 'og:url', 'og:type', 'og:site_name']) {
      assert.ok(doc.querySelector(`meta[property="${property}"]`)?.getAttribute('content'), property);
    }
  }
  if (path === '/') {
    assert.equal(doc.title, 'BanglaHub | Bangladeshi Community in the USA');
    const data = JSON.parse(doc.querySelector('script[data-banglahub-seo]')?.textContent || '{}');
    assert.deepEqual(data['@graph'].map(item => item['@type']), ['WebSite', 'Organization']);
    assert.ok(!html.includes('noindex'), 'Homepage must not contain noindex');
    console.log(doc.querySelector('title').outerHTML);
    console.log(doc.querySelector('link[rel="canonical"]').outerHTML);
    console.log(robots[0].outerHTML);
  }
  console.log(`PASS ${path}: robots=${robots[0].getAttribute('content')}; rendered app-root=${rootRendered}`);
}
