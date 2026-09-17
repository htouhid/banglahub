import { newsHandler } from './server/news/news-api';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
// Allow this deployment's exact preview hostname without using it for canonicals.
const angularApp = new AngularNodeAppEngine({
  allowedHosts: process.env['VERCEL_URL'] ? [process.env['VERCEL_URL']] : [],
});

app.get('/api/news', newsHandler);

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then(async (response) => {
      if (!response) return next();
      // Admin intentionally uses CSR. Apply noindex to its raw shell as well as
      // the prerendered auth pages, without making the public shell noindex.
      if (/^\/(?:admin|account|sign-in|sign-up)(?:\/|$)/.test(req.path) &&
          response.headers.get('content-type')?.includes('text/html')) {
        const html = (await response.text())
          .replace(/<meta\b[^>]*\bname=["']robots["'][^>]*>/gi, '')
          .replace('</head>', '<meta name="robots" content="noindex, nofollow"></head>');
        const headers = new Headers(response.headers);
        headers.delete('content-length');
        headers.set('X-Robots-Tag', 'noindex, nofollow');
        response = new Response(html, { status: response.status, headers });
      }
      return writeResponseToNodeResponse(response, res);
    })
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
