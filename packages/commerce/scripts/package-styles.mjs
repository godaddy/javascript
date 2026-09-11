import { readFile, readdir, writeFile } from 'node:fs/promises';

// npm consumers import one stylesheet for the managed cart UI.
const dist = new URL('../dist/', import.meta.url);
const cssFiles = (await readdir(dist)).filter(name => name.endsWith('.css') && name !== 'index.css');
await writeFile(new URL('index.css', dist), (await Promise.all(cssFiles.map(name => readFile(new URL(name, dist), 'utf8')))).join('\n'));
