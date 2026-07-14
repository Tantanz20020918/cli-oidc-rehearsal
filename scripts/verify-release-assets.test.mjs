import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const verifyScript = resolve(dirname(fileURLToPath(import.meta.url)), 'verify-release-assets.mjs');
const tarballName = 'package-1.0.0.tgz';

test('accepts a tarball covered by checksums.txt', async (t) => {
  const fixture = await makeFixture(t);
  const result = run(fixture);
  assert.equal(result.status, 0, result.stderr);
});

test('rejects a missing checksums.txt', async (t) => {
  const fixture = await makeFixture(t, { checksum: false });
  const result = run(fixture);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /checksums\.txt is required/);
});

test('rejects a checksum file without the tarball entry', async (t) => {
  const fixture = await makeFixture(t, { entryName: 'another-package.tgz' });
  const result = run(fixture);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /has no entry/);
});

test('rejects a tarball modified after checksums.txt was generated', async (t) => {
  const fixture = await makeFixture(t, { tamper: true });
  const result = run(fixture);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /checksum mismatch/);
});

async function makeFixture(t, {
  checksum = true,
  entryName = tarballName,
  tamper = false,
} = {}) {
  const fixture = await mkdtemp(resolve(tmpdir(), 'release-assets-'));
  t.after(() => rm(fixture, { recursive: true, force: true }));

  const original = Buffer.from('original tarball');
  await writeFile(resolve(fixture, tarballName), original);
  if (checksum) {
    const digest = createHash('sha256').update(original).digest('hex');
    await writeFile(resolve(fixture, 'checksums.txt'), `${digest}  ${entryName}\n`);
  }
  if (tamper) await writeFile(resolve(fixture, tarballName), 'tampered tarball');
  return fixture;
}

function run(fixture) {
  return spawnSync(process.execPath, [verifyScript, fixture], { encoding: 'utf8' });
}
