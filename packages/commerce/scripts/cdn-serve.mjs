import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

// Serve cdn/ under /v1/ so a page can load http://localhost:5181/v1/commerce.js
// as it would in production. Hashed chunks get the production immutable header.
// The loader and manifest are sent with no-store: in production they live for
// five minutes, which is exactly the kind of staleness that confuses local work.
const root = new URL('../cdn/', import.meta.url).pathname;
const port = Number(process.env.PORT || 5181);
const types = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = normalize(url.pathname);
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!path.startsWith('/v1/')) {
    res.writeHead(404).end('Only /v1/ is served');
    return;
  }
  const file = join(root, path.slice('/v1/'.length));
  try {
    if (!(await stat(file)).isFile()) throw new Error('not a file');
  } catch {
    res.writeHead(404).end('Not found');
    return;
  }
  const immutable = path.startsWith('/v1/chunks/');
  res.writeHead(200, {
    'Content-Type': types[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-store',
  });
  createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log(`Serving cdn/ at http://localhost:${port}/v1/commerce.js`);
});
