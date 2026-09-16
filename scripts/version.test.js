import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const versionScript = fileURLToPath(new URL('./version.js', import.meta.url));

async function fixture(t) {
  const cwd = await mkdtemp(path.join(tmpdir(), 'godaddy-release-test-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await mkdir(path.join(cwd, '.changeset'));
  await writeFile(path.join(cwd, 'package.json'), JSON.stringify({
    name: 'release-test-fixture', version: '1.0.0', type: 'module'
  }));
  await writeFile(path.join(cwd, '.changeset/config.json'), JSON.stringify({
    changelog: false,
    commit: false,
    snapshot: { useCalculatedVersion: true, prereleaseTemplate: '{tag}-{datetime}' }
  }));
  await exec('git', ['init', '-q'], { cwd });
  await exec('git', ['add', '.'], { cwd });
  await exec('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'Fixture'], { cwd });
  return cwd;
}

async function version(cwd, ...args) {
  try {
    const output = await exec(process.execPath, [versionScript, ...args], {
      cwd,
      env: { ...process.env, GITHUB_OUTPUT: path.join(cwd, 'output') }
    });
    return { ...output, status: 0 };
  } catch (error) {
    return { stdout: error.stdout, stderr: error.stderr, status: error.code };
  }
}

async function addChangeset(cwd, contents = '---\n"release-test-fixture": patch\n---\n\nTest release.\n') {
  await writeFile(path.join(cwd, '.changeset/test.md'), contents);
}

for (const args of [[], ['--snapshot', 'beta'], ['--snapshot=beta']]) {
  test(`empty changesets skip versioning: ${args.join(' ') || 'stable'}`, async t => {
    const cwd = await fixture(t);
    const result = await version(cwd, ...args);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(await readFile(path.join(cwd, 'package.json'))).version, '1.0.0');
    assert.equal(await readFile(path.join(cwd, 'output'), 'utf8'), 'versioned=false\n');
  });
}

test('pending changeset produces a calculated snapshot and enables publishing', async t => {
  const cwd = await fixture(t);
  await addChangeset(cwd);
  const result = await version(cwd, '--snapshot', 'beta');
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(JSON.parse(await readFile(path.join(cwd, 'package.json'))).version, /^1\.0\.1-beta-\d+$/);
  assert.equal(await readFile(path.join(cwd, 'output'), 'utf8'), 'versioned=true\n');
});

test('normal versioning consumes the changeset and bumps the package', async t => {
  const cwd = await fixture(t);
  await addChangeset(cwd);
  const result = await version(cwd);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(JSON.parse(await readFile(path.join(cwd, 'package.json'))).version, '1.0.1');
  await assert.rejects(readFile(path.join(cwd, '.changeset/test.md')), { code: 'ENOENT' });
});

test('an empty changeset does not enable snapshot publishing', async t => {
  const cwd = await fixture(t);
  await addChangeset(cwd, '---\n---\n');
  const result = await version(cwd, '--snapshot', 'beta');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(path.join(cwd, 'output'), 'utf8'), 'versioned=false\n');
});

test('versioning errors fail without enabling publishing', async t => {
  const cwd = await fixture(t);
  await addChangeset(cwd, '---\n"nonexistent-package": patch\n---\n\nInvalid release.\n');
  const result = await version(cwd, '--snapshot', 'beta');
  assert.notEqual(result.status, 0);
  await assert.rejects(readFile(path.join(cwd, 'output')), { code: 'ENOENT' });
});
