import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const releaseDir = resolve(process.argv[2] ?? 'release');
const checksumPath = resolve(releaseDir, 'checksums.txt');

let checksumText;
try {
  checksumText = await readFile(checksumPath, 'utf8');
} catch (error) {
  fail(`checksums.txt is required: ${error.message}`);
}

const entries = new Map();
for (const line of checksumText.split('\n')) {
  if (!line.trim()) continue;
  const match = /^([a-fA-F0-9]{64})  ([^/\\]+)$/.exec(line);
  if (!match) fail(`malformed checksum line: ${JSON.stringify(line)}`);
  entries.set(match[2], match[1].toLowerCase());
}

const tarballs = (await readdir(releaseDir)).filter((name) => name.endsWith('.tgz'));
if (tarballs.length !== 1) {
  fail(`expected exactly one npm tarball, found ${tarballs.length}`);
}

const tarball = tarballs[0];
const expected = entries.get(tarball);
if (!expected) fail(`checksums.txt has no entry for ${tarball}`);

const actual = createHash('sha256')
  .update(await readFile(resolve(releaseDir, tarball)))
  .digest('hex');

if (actual !== expected) {
  fail(`checksum mismatch for ${basename(tarball)}: expected ${expected}, got ${actual}`);
}

console.log(`verified ${tarball}: ${actual}`);

function fail(message) {
  console.error(`release asset verification failed: ${message}`);
  process.exit(1);
}
