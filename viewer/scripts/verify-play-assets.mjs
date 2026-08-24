import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  GENERATED_PLAY_MANIFEST,
  GENERATED_PLAY_ROOT,
  createExpectedPlayManifest,
} from './build-play-assets.mjs';

const normalizePath = (value) => value.split(path.sep).join('/');
const stableCompare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const scriptPath = fileURLToPath(import.meta.url);

async function listGeneratedFiles(root, directory = root, relativeDirectory = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => stableCompare(left.name, right.name));
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    const relative = path.join(relativeDirectory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Generated Play assets contain a symbolic link: ${absolute}`);
    if (entry.isDirectory()) files.push(...await listGeneratedFiles(root, absolute, relative));
    else if (entry.isFile()) files.push(normalizePath(relative));
    else throw new Error(`Generated Play assets contain an unsupported entry: ${absolute}`);
  }
  return files;
}

export async function verifyPlayAssets({
  generatedRoot = GENERATED_PLAY_ROOT,
  generatedManifest = GENERATED_PLAY_MANIFEST,
} = {}) {
  const errors = [];
  let actualManifest;
  try {
    const manifestStat = await lstat(generatedManifest);
    if (!manifestStat.isFile() || manifestStat.isSymbolicLink()) {
      throw new Error('manifest.json is not a regular file');
    }
    actualManifest = JSON.parse(await readFile(generatedManifest, 'utf8'));
  } catch (error) {
    throw new Error(`Generated Play manifest is missing or invalid: ${error.message}`);
  }
  const expectedManifest = await createExpectedPlayManifest();
  if (JSON.stringify(actualManifest) !== JSON.stringify(expectedManifest)) {
    errors.push('generated manifest is stale or does not match the canonical allowlist');
  }

  const expectedFiles = new Set([
    'manifest.json',
    ...expectedManifest.files.map((entry) => entry.path),
  ]);
  let actualFiles = [];
  try {
    actualFiles = await listGeneratedFiles(generatedRoot);
  } catch (error) {
    errors.push(error.message);
  }
  const actualFileSet = new Set(actualFiles);
  for (const expected of expectedFiles) {
    if (!actualFileSet.has(expected)) errors.push(`missing generated asset: ${expected}`);
  }
  for (const actual of actualFileSet) {
    if (!expectedFiles.has(actual)) errors.push(`unexpected generated asset: ${actual}`);
  }

  for (const entry of expectedManifest.files) {
    if (!actualFileSet.has(entry.path)) continue;
    const filePath = path.join(generatedRoot, ...entry.path.split('/'));
    const bytes = await readFile(filePath);
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (bytes.byteLength !== entry.bytes) errors.push(`size mismatch: ${entry.path}`);
    if (digest !== entry.sha256) errors.push(`hash mismatch: ${entry.path}`);
  }

  if (errors.length > 0) {
    throw new Error(`Generated Play asset verification failed:\n- ${errors.join('\n- ')}`);
  }
  return expectedManifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const manifest = await verifyPlayAssets();
    console.log(`Verified ${manifest.files.length} deterministic Play asset(s).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
