import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

// Finish the CDN build: merge emitted CSS into one hashed stylesheet, point the
// runtime at it, write the classic-script loader that pages include as
// /v1/commerce.js, and write a manifest that the deploy and support can read.
const root = new URL('../cdn/', import.meta.url).pathname;
const loader = join(root, 'commerce.js');

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const path = join(dir, name);
    if ((await stat(path)).isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

const files = await walk(root);
const runtimes = files.filter(f => /\/chunks\/runtime-[^/]+\.js$/.test(f));
if (runtimes.length !== 1)
  throw new Error(`expected one runtime chunk, found ${runtimes.length}`);
const [entry] = runtimes;
const cssFiles = files.filter(f => f.endsWith('.css'));
if (cssFiles.length === 0) throw new Error('CDN build emitted no stylesheet');
const css = (await Promise.all(cssFiles.map(f => readFile(f, 'utf8')))).join('\n');
const hash = createHash('sha256').update(css).digest('hex').slice(0, 8);
const stylesheet = `chunks/commerce-${hash}.css`;
await writeFile(join(root, stylesheet), css);
await Promise.all(
  cssFiles
    .filter(f => f !== join(root, stylesheet))
    .flatMap(f => [rm(f), rm(`${f}.map`, { force: true })])
);

const runtime = await readFile(entry, 'utf8');
if (!runtime.includes('__GDDY_STYLESHEET__'))
  throw new Error('commerce.js has no stylesheet placeholder');
// The runtime lives in chunks/ beside the stylesheet, so the link is a sibling.
await writeFile(
  entry,
  runtime.replaceAll('__GDDY_STYLESHEET__', `./${relative(join(root, 'chunks'), join(root, stylesheet))}`)
);

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const listed = await Promise.all(
  (await walk(root))
    .filter(f => !f.endsWith('manifest.json'))
    .sort()
    .map(async f => ({ path: relative(root, f), bytes: (await stat(f)).size }))
);
// Same rule as tsdown.cdn.config.ts, so the manifest matches the runtime.
function commit() {
  if (process.env.GDDY_COMMIT) return process.env.GDDY_COMMIT;
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}
const release = { version: pkg.version, commit: commit() };
if (!runtime.includes(release.commit))
  throw new Error(`runtime does not carry commit ${release.commit}`);

// A classic script (works with <script defer src>) that imports the hashed
// runtime relative to its own URL. import() is allowed in classic scripts;
// import.meta and export are not, which is why the runtime is a separate file.
const runtimePath = relative(root, entry);
await writeFile(
  loader,
  [
    `/*! ${pkg.name} ${release.version} ${release.commit} */`,
    '(function(){',
    'var script=document.currentScript;',
    'var base=script&&script.src?script.src:location.href;',
    `import(new URL(${JSON.stringify(`./${runtimePath}`)},base).href).catch(function(error){`,
    'window.dispatchEvent(new CustomEvent("gddy:error",{detail:{error:error}}));',
    '});',
    '})();',
    '',
  ].join('\n')
);
await writeFile(
  join(root, 'manifest.json'),
  `${JSON.stringify(
    {
      name: pkg.name,
      ...release,
      builtAt: new Date().toISOString(),
      entry: 'commerce.js',
      runtime: runtimePath,
      stylesheet,
      files: listed,
    },
    null,
    2
  )}\n`
);
console.log(`cdn/: ${listed.length} files, runtime ${runtimePath}, stylesheet ${stylesheet}`);
