import { appendFile, readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { readChangesets } from '@changesets/read';

const args = process.argv.slice(2);
const snapshot = args.some(arg => arg === '--snapshot' || arg.startsWith('--snapshot='));
const changesets = await readChangesets(process.cwd());
let preState;

try {
  preState = JSON.parse(await readFile('.changeset/pre.json', 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const pending = snapshot
  ? changesets.some(changeset => changeset.releases.length > 0)
  : changesets.length > 0 || preState?.mode === 'exit';

if (pending) {
  const cli = fileURLToPath(import.meta.resolve('@changesets/cli/bin.js'));
  const child = spawn(process.execPath, [cli, 'version', ...args], { stdio: 'inherit' });
  const [status] = await once(child, 'exit');
  if (status !== 0) process.exit(status ?? 1);
} else {
  console.info('No unreleased changesets; skipping versioning.');
}

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `versioned=${pending}\n`);
}
