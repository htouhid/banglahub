// Keep the Angular-generated ESM server intact; do not compile it as CommonJS.
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

let server;
export default async function handler(req, res) {
  server ??= import(pathToFileURL(join(process.cwd(), 'dist/banglahub/server/server.mjs')).href);
  const { reqHandler } = await server;
  return reqHandler(req, res);
}
