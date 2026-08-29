import { createHash } from 'node:crypto';
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);

export const REPOSITORY_ROOT = path.resolve(scriptDirectory, '..', '..');
export const VIEWER_ROOT = path.join(REPOSITORY_ROOT, 'viewer');
export const GENERATED_PLAY_ROOT = path.join(VIEWER_ROOT, 'generated', 'play');
export const GENERATED_PLAY_MANIFEST = path.join(GENERATED_PLAY_ROOT, 'manifest.json');

const GAMEPLAY_FILES = Object.freeze([
  'card-catalog.json',
  'decks.json',
  'domain-snapshot.json',
  'ticket-templates.json',
  'diagnosis-v2-migration.json',
  'task-014-parts.json',
  'domain-snapshot-v2.json',
  'card-catalog-v3.json',
  'decks-v3.json',
  'playable-coverage-v3.json',
  'technical-action-glossary-v1.json',
  'technical-copy-review-v1.json',
  'tutorials-v1.json',
]);

const STORY_RUNTIME_FILES = Object.freeze([
  'checkpoint.mjs',
  'conditions.mjs',
  'constants.mjs',
  'index.mjs',
  'interpreter.mjs',
  'match-boundary.mjs',
  'validator.mjs',
]);

const STATIC_ASSET_EXTENSIONS = new Set([
  '.avif', '.gif', '.jpeg', '.jpg', '.json', '.md', '.png', '.svg', '.txt', '.webp', '.woff', '.woff2',
]);
const VENDOR_EXTENSIONS = new Set(['.js', '.json', '.md', '.mjs', '.txt']);

const normalizePath = (value) => value.split(path.sep).join('/');
const stableCompare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

function assertSafeGeneratedRoot() {
  const generatedParent = `${path.resolve(VIEWER_ROOT, 'generated')}${path.sep}`;
  const target = path.resolve(GENERATED_PLAY_ROOT);
  if (!target.startsWith(generatedParent) || target === generatedParent.slice(0, -1)) {
    throw new Error(`Refusing to replace unsafe generated path: ${target}`);
  }
}

async function sha256File(filePath) {
  const bytes = await readFile(filePath);
  return {
    bytes,
    digest: createHash('sha256').update(bytes).digest('hex'),
  };
}

async function walkRegularFiles(root, { allowedExtensions, required }) {
  let rootStat;
  try {
    rootStat = await lstat(root);
  } catch (error) {
    if (!required && error?.code === 'ENOENT') return [];
    throw error;
  }
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error(`Play asset source must be a real directory: ${root}`);
  }

  const files = [];
  async function visit(directory, relativeDirectory = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => stableCompare(left.name, right.name));
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = path.join(relativeDirectory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not staged: ${absolute}`);
      if (entry.isDirectory()) {
        await visit(absolute, relative);
      } else if (entry.isFile()) {
        const extension = path.extname(entry.name).toLowerCase();
        if (!allowedExtensions.has(extension)) {
          throw new Error(`Unexpected executable or unsupported Play asset source: ${absolute}`);
        }
        files.push(relative);
      } else {
        throw new Error(`Unsupported Play asset source type: ${absolute}`);
      }
    }
  }
  await visit(root);
  return files;
}

async function sourceEntries() {
  const entries = [];
  const moduleGroups = [
    ['src/engine', 'src/engine'],
    ['src/builder', 'src/builder'],
    ['src/shared', 'src/shared'],
  ];
  for (const [sourceRoot, outputRoot] of moduleGroups) {
    const absoluteRoot = path.join(REPOSITORY_ROOT, sourceRoot);
    const files = await walkRegularFiles(absoluteRoot, {
      allowedExtensions: new Set(['.mjs']),
      required: true,
    });
    for (const relative of files) {
      entries.push({
        source: normalizePath(path.join(sourceRoot, relative)),
        output: normalizePath(path.join(outputRoot, relative)),
      });
    }
  }

  for (const filename of STORY_RUNTIME_FILES) {
    entries.push({
      source: `src/story/${filename}`,
      output: `src/story/${filename}`,
    });
  }

  for (const filename of GAMEPLAY_FILES) {
    entries.push({
      source: `content/gameplay-v1/${filename}`,
      output: `content/gameplay-v1/${filename}`,
    });
  }

  const storyFiles = await walkRegularFiles(path.join(REPOSITORY_ROOT, 'content', 'story-v1'), {
    allowedExtensions: new Set(['.json']),
    required: true,
  });
  for (const relative of storyFiles) {
    const normalizedRelative = normalizePath(relative);
    const stageable = normalizedRelative.startsWith('fixtures/')
      || /^campaigns\/[^/]+\/(?:manifest|registry|matches|review-episodes)\.json$/.test(normalizedRelative)
      || /^campaigns\/[^/]+\/(?:scripts|texts)\/[a-z0-9._/-]+\.json$/.test(normalizedRelative);
    if (!stageable) continue;
    entries.push({
      source: normalizePath(path.join('content/story-v1', normalizedRelative)),
      output: normalizePath(path.join('content/story-v1', normalizedRelative)),
    });
  }

  const assetFiles = await walkRegularFiles(path.join(REPOSITORY_ROOT, 'assets'), {
    allowedExtensions: STATIC_ASSET_EXTENSIONS,
    required: false,
  });
  for (const relative of assetFiles) {
    entries.push({
      source: normalizePath(path.join('assets', relative)),
      output: normalizePath(path.join('assets', relative)),
    });
  }

  const viewerPlayAssetFiles = await walkRegularFiles(path.join(VIEWER_ROOT, 'assets', 'play'), {
    allowedExtensions: STATIC_ASSET_EXTENSIONS,
    required: true,
  });
  for (const relative of viewerPlayAssetFiles) {
    entries.push({
      source: normalizePath(path.join('viewer/assets/play', relative)),
      output: normalizePath(path.join('assets/play', relative)),
    });
  }

  const vendorFiles = await walkRegularFiles(path.join(VIEWER_ROOT, 'vendor'), {
    allowedExtensions: VENDOR_EXTENSIONS,
    required: true,
  });
  for (const relative of vendorFiles) {
    entries.push({
      source: normalizePath(path.join('viewer/vendor', relative)),
      output: normalizePath(path.join('vendor', relative)),
    });
  }

  entries.sort((left, right) => stableCompare(left.output, right.output));
  const outputs = new Set();
  for (const entry of entries) {
    if (outputs.has(entry.output)) throw new Error(`Duplicate staged output: ${entry.output}`);
    outputs.add(entry.output);
  }
  return entries;
}

export async function createExpectedPlayManifest() {
  const entries = await sourceEntries();
  const files = [];
  for (const entry of entries) {
    const sourcePath = path.join(REPOSITORY_ROOT, ...entry.source.split('/'));
    const source = await sha256File(sourcePath);
    files.push({
      path: entry.output,
      source: entry.source,
      bytes: source.bytes.byteLength,
      sha256: source.digest,
    });
  }
  return {
    format_version: 1,
    profile_id: 'solo-pages-v2',
    hash_algorithm: 'sha256',
    files,
  };
}

export async function buildPlayAssets() {
  assertSafeGeneratedRoot();
  const manifest = await createExpectedPlayManifest();
  await rm(GENERATED_PLAY_ROOT, { recursive: true, force: true });
  await mkdir(GENERATED_PLAY_ROOT, { recursive: true });
  for (const entry of manifest.files) {
    const sourcePath = path.join(REPOSITORY_ROOT, ...entry.source.split('/'));
    const outputPath = path.join(GENERATED_PLAY_ROOT, ...entry.path.split('/'));
    await mkdir(path.dirname(outputPath), { recursive: true });
    await copyFile(sourcePath, outputPath);
  }
  await writeFile(GENERATED_PLAY_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const manifest = await buildPlayAssets();
  console.log(`Staged ${manifest.files.length} deterministic Play asset(s).`);
}
