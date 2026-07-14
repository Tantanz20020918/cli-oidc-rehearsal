import { readFile } from 'node:fs/promises';

const [packageJson, packageLock] = await Promise.all([
  readJson('package.json'),
  readJson('package-lock.json'),
]);

const versions = new Map([
  ['package.json', packageJson.version],
  ['package-lock.json', packageLock.version],
  ['package-lock.json packages[""]', packageLock.packages?.['']?.version],
]);

for (const [source, version] of versions) {
  if (version !== packageJson.version) {
    fail(`${source} has version ${JSON.stringify(version)}; expected ${packageJson.version}`);
  }
}

const tag = process.argv[2];
if (tag) {
  if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(tag)) {
    fail(`release tag ${JSON.stringify(tag)} must be a v-prefixed semantic version`);
  }

  const tagVersion = tag.slice(1);
  if (tagVersion !== packageJson.version) {
    fail(`release tag ${tag} does not match package version ${packageJson.version}`);
  }
}

console.log(`release versions are consistent at ${packageJson.version}${tag ? ` (${tag})` : ''}`);

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    fail(`cannot read ${path}: ${error.message}`);
  }
}

function fail(message) {
  console.error(`release verification failed: ${message}`);
  process.exit(1);
}
