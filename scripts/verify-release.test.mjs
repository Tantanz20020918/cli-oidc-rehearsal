import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const verifyScript = resolve(dirname(fileURLToPath(import.meta.url)), 'verify-release.mjs');

test('accepts matching package, lock, and tag versions', async (t) => {
  const result = await verify(t, { tag: 'v1.2.3-beta.0' });
  assert.equal(result.status, 0, result.stderr);
});

test('rejects an invalid release tag', async (t) => {
  const result = await verify(t, { tag: 'vbanana' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must be a v-prefixed semantic version/);
});

test('rejects a tag that does not match package.json', async (t) => {
  const result = await verify(t, { tag: 'v1.2.4' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /does not match package version/);
});

test('rejects a mismatched package-lock top-level version', async (t) => {
  const result = await verify(t, { lockVersion: '1.2.4' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /package-lock\.json has version/);
});

test('rejects a mismatched package-lock root package version', async (t) => {
  const result = await verify(t, { rootVersion: '1.2.4' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /packages\[""\] has version/);
});

async function verify(t, {
  tag = 'v1.2.3-beta.0',
  packageVersion = '1.2.3-beta.0',
  lockVersion = packageVersion,
  rootVersion = packageVersion,
} = {}) {
  const fixture = await mkdtemp(resolve(tmpdir(), 'release-verify-'));
  t.after(() => rm(fixture, { recursive: true, force: true }));

  await Promise.all([
    writeFile(resolve(fixture, 'package.json'), JSON.stringify({ version: packageVersion })),
    writeFile(resolve(fixture, 'package-lock.json'), JSON.stringify({
      version: lockVersion,
      packages: { '': { version: rootVersion } },
    })),
  ]);

  return spawnSync(process.execPath, [verifyScript, tag], {
    cwd: fixture,
    encoding: 'utf8',
  });
}
