import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const INVENTORY_PATH = path.join(REPOSITORY_ROOT, 'docs', 'art', 'task-011-illustration-inventory.json');
const VIEWER_MANIFEST_PATH = path.join(REPOSITORY_ROOT, 'viewer', 'content', 'manifest.json');
const ASSET_MANIFEST_PATH = path.join(REPOSITORY_ROOT, 'viewer', 'assets', 'play', 'assets.json');
const FOUNDATION_SNAPSHOT_PATH = path.join(REPOSITORY_ROOT, 'content', 'gameplay-v1', 'domain-snapshot.json');
const readJson = async (filename) => JSON.parse(await readFile(filename, 'utf8'));
const writeJson = async (filename, value) => writeFile(filename, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

function lowercaseFirst(value) {
  return value ? `${value[0].toLowerCase()}${value.slice(1)}` : value;
}

function altTextFor(subject) {
  const description = subject.technical_description.replace(/[.]$/, '');
  if (subject.family === 'symptom') {
    return `Wide night-shift server view showing ${lowercaseFirst(description)} without identifying its cause.`;
  }
  if (subject.family === 'command') {
    return `Dark service console with abstract ${subject.display_name} output beside enterprise server hardware.`;
  }
  if (subject.family === 'test') {
    return `Night-shift server test setup for ${subject.display_name}, staged without indicating a result.`;
  }
  if (subject.family === 'repair') {
    return `${subject.display_name} in progress at a night-shift server service bench, before verification.`;
  }
  return `Neutral post-repair measurement setup for ${subject.display_name}, without indicating a pass or failure.`;
}

function illustrationFor(subject) {
  return {
    asset_id: subject.asset_id,
    alt_text: altTextFor(subject),
    caption: `Canonical ${subject.family} illustration for ${subject.display_name}.`,
    crop_hint: 'center',
    license_note: 'Generated for TASK-011 with OpenAI built-in image generation; repository use follows applicable OpenAI terms and the repository license.',
  };
}

export async function applyTask011ArtMetadata() {
  const [inventory, viewerManifest, assetManifest, foundationSnapshot] = await Promise.all([
    readJson(INVENTORY_PATH),
    readJson(VIEWER_MANIFEST_PATH),
    readJson(ASSET_MANIFEST_PATH),
    readJson(FOUNDATION_SNAPSHOT_PATH),
  ]);
  if (inventory.total_subjects !== 104) throw new Error('TASK-011 inventory must contain exactly 104 subjects.');
  const subjectById = new Map(inventory.subjects.map((subject) => [subject.domain_id, subject]));
  const seen = new Set();
  for (const filename of viewerManifest.files) {
    const packPath = path.join(REPOSITORY_ROOT, 'viewer', 'content', filename);
    const pack = await readJson(packPath);
    let changed = false;
    for (const entity of pack.entities) {
      const subject = subjectById.get(entity.id);
      if (!subject) continue;
      entity.presentation ??= { display_name: subject.display_name };
      entity.presentation.illustration = illustrationFor(subject);
      seen.add(entity.id);
      changed = true;
    }
    if (changed) await writeJson(packPath, pack);
  }
  const missing = [...subjectById.keys()].filter((id) => !seen.has(id));
  if (missing.length) throw new Error(`TASK-011 subjects are missing from Viewer packs: ${missing.join(', ')}`);

  let synchronizedFoundationRecords = 0;
  for (const entity of foundationSnapshot.entities) {
    const subject = subjectById.get(entity.id);
    if (!subject) continue;
    entity.presentation.illustration = illustrationFor(subject);
    synchronizedFoundationRecords += 1;
  }
  await writeJson(FOUNDATION_SNAPSHOT_PATH, foundationSnapshot);

  assetManifest.asset_manifest_version = 'play-assets-v2';
  for (const subject of inventory.subjects) {
    assetManifest.assets[subject.asset_id] = {
      src: subject.output_path.replace(/^viewer\/assets\/play\//, ''),
      kind: 'canonical',
      category: subject.entity_type,
      alt_text: altTextFor(subject),
    };
  }
  assetManifest.assets = Object.fromEntries(Object.entries(assetManifest.assets)
    .sort(([left], [right]) => left.localeCompare(right)));
  await writeJson(ASSET_MANIFEST_PATH, assetManifest);
  return {
    updatedDomainRecords: seen.size,
    registeredAssets: inventory.subjects.length,
    synchronizedFoundationRecords,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const result = await applyTask011ArtMetadata();
  console.log(`Updated ${result.updatedDomainRecords} domain records, synchronized ${result.synchronizedFoundationRecords} foundation records, and registered ${result.registeredAssets} canonical assets.`);
}
