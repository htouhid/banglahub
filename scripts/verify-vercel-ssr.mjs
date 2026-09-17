// Run after `vercel build --prod`. Tests packaged routing and the actual function
// with Vercel-style forwarded headers, which a plain localhost test omits.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const output = resolve('.vercel/output');
const config = JSON.parse(readFileSync(resolve(output, 'config.json'), 'utf8'));
const first = config.routes[0];
assert.ok(new RegExp(first.src).test('/'));
assert.equal(first.dest, '/api/ssr');
assert.equal(first.continue, undefined);
assert.equal(config.routes[1].handle, 'filesystem');
const functionDir = resolve(output, `functions/${first.dest.slice(1)}.func`);
const runtime = JSON.parse(readFileSync(resolve(functionDir, '.vc-config.json'), 'utf8'));
assert.equal(runtime.handler, 'api/ssr.mjs');
assert.ok(existsSync(resolve(functionDir, 'dist/banglahub/server/server.mjs')));
assert.ok(existsSync(resolve(output, 'functions/api/news.func/.vc-config.json')));
console.log(`Packaged / matches first rule ${first.src} -> ${first.dest}, before filesystem.`);
const check = pathToFileURL(resolve('scripts/verify-ssr-seo.mjs')).href;
process.chdir(functionDir);
const { default: handler } = await import(pathToFileURL(resolve(runtime.handler)).href);
const server = createServer((req, res) => {
  Promise.resolve(handler(req, res)).catch(error => {
    console.error(error); res.statusCode = 500; res.end();
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
process.env['SSR_TEST_ORIGIN'] = `http://127.0.0.1:${server.address().port}`;
process.env['SSR_TEST_PROXY_HEADERS'] = '1';
try { await import(check); }
catch (error) { console.error(error); process.exitCode = 1; }
finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
