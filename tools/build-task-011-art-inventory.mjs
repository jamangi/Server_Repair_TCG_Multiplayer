import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CARD_CATALOG_PATH = path.join(REPOSITORY_ROOT, 'content', 'gameplay-v1', 'card-catalog-v3.json');
const DOMAIN_SNAPSHOT_PATH = path.join(REPOSITORY_ROOT, 'content', 'gameplay-v1', 'domain-snapshot-v2.json');
const ASSET_MANIFEST_PATH = path.join(REPOSITORY_ROOT, 'viewer', 'assets', 'play', 'assets.json');
const PROVENANCE_PATH = path.join(REPOSITORY_ROOT, 'art_sources', 'task-011', 'generation-log.json');
const OUTPUT_PATH = path.join(REPOSITORY_ROOT, 'docs', 'art', 'task-011-illustration-inventory.json');

const ACTION_FAMILIES = Object.freeze({
  test: Object.freeze({ family: 'test', directory: 'tests', width: 800, height: 450, masterWidth: 1600, masterHeight: 900, byteBudget: 180 * 1024 }),
  command: Object.freeze({ family: 'command', directory: 'commands', width: 800, height: 450, masterWidth: 1600, masterHeight: 900, byteBudget: 180 * 1024 }),
  repair_procedure: Object.freeze({ family: 'repair', directory: 'repairs', width: 800, height: 450, masterWidth: 1600, masterHeight: 900, byteBudget: 180 * 1024 }),
  validation_procedure: Object.freeze({ family: 'verify', directory: 'verifications', width: 800, height: 450, masterWidth: 1600, masterHeight: 900, byteBudget: 180 * 1024 }),
});

const EXPECTED_COUNTS = Object.freeze({ test: 37, command: 13, repair: 12, verify: 9, symptom: 33 });
const stableCompare = (left, right) => left.localeCompare(right);
const readJson = async (filename) => JSON.parse(await readFile(filename, 'utf8'));
const readable = (value) => typeof value === 'string' && value.trim() ? value.trim() : null;
const stableFilename = (id) => id.replaceAll('.', '-').replaceAll('_', '-');
const subsystemFor = (record) => record.category || record.id.split('.')[1] || 'general';

async function readOptionalJson(filename, fallback) {
  try {
    return await readJson(filename);
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
}

function assetIdFor(record) {
  return readable(record.presentation?.illustration?.asset_id) || `art.${record.id}`;
}

function technicalDetails(record) {
  if (record.entity_type === 'test') {
    return [
      `Method: ${record.test_type}.`,
      ...(record.tool_requirement_ids?.length ? [`Required tools: ${record.tool_requirement_ids.join(', ')}.`] : []),
      ...(record.target_component_ids?.length ? [`Targets: ${record.target_component_ids.join(', ')}.`] : []),
    ].join(' ');
  }
  if (record.entity_type === 'command') {
    return [
      `Platform: ${record.platform}.`,
      readable(record.purpose),
      ...(record.capabilities?.length ? [`Information shape: ${record.capabilities.join('; ')}.`] : []),
    ].filter(Boolean).join(' ');
  }
  if (record.entity_type === 'repair_procedure') {
    return (record.steps_summary ?? []).join(' ');
  }
  if (record.entity_type === 'validation_procedure') {
    return (record.success_conditions ?? []).join(' ');
  }
  return readable(record.description) || readable(record.presentation?.short_description) || '';
}

function familyDirection(family) {
  if (family === 'test') return 'Depict the act of observing or exercising the subject with a credible instrument, controlled setup, telemetry trace, or inspection viewpoint; do not imply a pass or failure.';
  if (family === 'command') return 'Use a coherent dark service-console scene with abstract unreadable structured rows and nearby relevant hardware; vary the information shape without readable generated text or numbers.';
  if (family === 'repair') return 'Center the affected component and the corrective physical or configuration action in progress; show credible tools, antistatic practice, and service posture without implying restored service.';
  if (family === 'verify') return 'Show the repaired capability under neutral measurement or observation; avoid green checks, successful values, victory signals, or a guaranteed result.';
  return 'Illustrate only the public observed manifestation and operational uncertainty; do not identify, spotlight, or reveal any hidden broken component or candidate answer.';
}

function promptFor(record, family) {
  const title = record.presentation?.display_name || record.id;
  const description = record.presentation?.short_description || record.description || '';
  const technical = technicalDetails(record);
  const safety = readable(record.education_text);
  const symptom = family === 'symptom';
  const dimensions = symptom
    ? 'Create a very wide 10:3 panorama, composed for 2400x720. Keep all critical observed information in the centered 2.15:1 safe region while ambient rack, cable, or room detail extends across the edges; it must also survive a 3.35:1 crop.'
    : 'Create a landscape 16:9 composition for a 1600x900 master. Keep the meaningful tool, component, or readout in the central 60 percent so it remains recognizable in shallow Bench and compact-hand crops.';
  return [
    `Create one original, technically grounded cinematic-realistic illustration for the educational Server Repair subject “${title}”.`,
    `Domain meaning: ${description}`,
    technical ? `Technical context: ${technical}` : '',
    safety ? `Safety or interpretation boundary: ${safety}` : '',
    familyDirection(family),
    dimensions,
    'Shared world: a realistic enterprise server room or service bench during a focused night shift, deep graphite and navy surroundings, cool cyan rack light, limited warm amber task light, plausible indicator colors, controlled glow, tactile metal, plastic, cabling, and tools.',
    'No people unless hands materially clarify a safe procedure. No brands, logos, watermarks, fantasy circuitry, combat framing, anthropomorphic machines, UI frames, card borders, baked labels, readable terminal syntax, pseudo-text, hidden answers, diagnostic outcomes, evidence dispositions, future machine state, or success certification.',
  ].filter(Boolean).join(' ');
}

function createSubject(record, family, manifest, provenance) {
  const config = family === 'symptom'
    ? { family, directory: subsystemFor(record), width: 1200, height: 360, masterWidth: 2400, masterHeight: 720, byteBudget: 220 * 1024 }
    : ACTION_FAMILIES[record.entity_type];
  const filename = `${stableFilename(record.id)}.webp`;
  const outputPath = family === 'symptom'
    ? `viewer/assets/play/canonical/symptoms/${config.directory}/${filename}`
    : `viewer/assets/play/canonical/actions/${config.directory}/${filename}`;
  const masterPath = family === 'symptom'
    ? `art_sources/task-011/masters/symptoms/${config.directory}/${filename}`
    : `art_sources/task-011/masters/actions/${config.directory}/${filename}`;
  const assetId = assetIdFor(record);
  const registered = manifest.assets?.[assetId] ?? null;
  const generation = provenance.subjects?.[record.id] ?? null;
  return {
    domain_id: record.id,
    display_name: record.presentation?.display_name || record.id,
    entity_type: record.entity_type,
    family,
    subsystem: subsystemFor(record),
    technical_description: record.presentation?.short_description || record.description || '',
    safety_or_interpretation_note: readable(record.education_text),
    existing_asset_id: readable(record.presentation?.illustration?.asset_id),
    asset_id: assetId,
    target_aspect_ratio: symptomAspect(family),
    prompt_summary: `${familyDirection(family)} ${technicalDetails(record)}`.trim(),
    prompt: promptFor(record, family),
    output_path: outputPath,
    master_path: masterPath,
    expected_dimensions: { width: config.width, height: config.height },
    expected_master_dimensions: { width: config.masterWidth, height: config.masterHeight },
    byte_budget: config.byteBudget,
    manifest_state: registered ? { kind: registered.kind, src: registered.src, category: registered.category } : null,
    dimensions: generation?.dimensions ?? null,
    bytes: generation?.bytes ?? null,
    sha256: generation?.sha256 ?? null,
    provenance: generation?.provenance ?? null,
    review_state: generation?.review_state ?? 'pending',
    review_notes: generation?.review_notes ?? [],
  };
}

function symptomAspect(family) {
  return family === 'symptom' ? '10:3' : '16:9';
}

function assertScope(subjects) {
  const counts = Object.fromEntries(Object.keys(EXPECTED_COUNTS).map((family) => [
    family,
    subjects.filter((subject) => subject.family === family).length,
  ]));
  for (const [family, expected] of Object.entries(EXPECTED_COUNTS)) {
    if (counts[family] !== expected) {
      throw new Error(`TASK-011 scope drift: expected ${expected} ${family} subjects, found ${counts[family]}.`);
    }
  }
  if (subjects.length !== 104 || new Set(subjects.map((subject) => subject.domain_id)).size !== 104) {
    throw new Error('TASK-011 requires exactly 104 unique domain subjects.');
  }
  if (new Set(subjects.map((subject) => subject.asset_id)).size !== 104) {
    throw new Error('TASK-011 requires exactly 104 unique stable asset IDs.');
  }
  return counts;
}

async function enrichFileFacts(subject) {
  const absolute = path.join(REPOSITORY_ROOT, ...subject.output_path.split('/'));
  try {
    const bytes = await readFile(absolute);
    return {
      ...subject,
      bytes: bytes.byteLength,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    };
  } catch (error) {
    if (error?.code === 'ENOENT') return subject;
    throw error;
  }
}

export async function buildTask011ArtInventory() {
  const [cards, domain, manifest, provenance] = await Promise.all([
    readJson(CARD_CATALOG_PATH),
    readJson(DOMAIN_SNAPSHOT_PATH),
    readJson(ASSET_MANIFEST_PATH),
    readOptionalJson(PROVENANCE_PATH, { format_version: 1, subjects: {} }),
  ]);
  const domainById = new Map(domain.entities.map((record) => [record.id, record]));
  const actionRecords = cards.cards.map((card) => {
    const record = domainById.get(card.primary_domain_reference?.entity_id);
    if (!record) throw new Error(`Card ${card.id} has an unresolved primary domain reference.`);
    return record;
  });
  if (new Set(actionRecords.map((record) => record.id)).size !== actionRecords.length) {
    throw new Error('Published Cards do not map one-to-one to unique primary domain records.');
  }
  const symptoms = domain.entities.filter((record) => record.entity_type === 'symptom');
  const baseSubjects = [
    ...actionRecords.map((record) => createSubject(record, ACTION_FAMILIES[record.entity_type].family, manifest, provenance)),
    ...symptoms.map((record) => createSubject(record, 'symptom', manifest, provenance)),
  ].sort((left, right) => stableCompare(left.domain_id, right.domain_id));
  const counts = assertScope(baseSubjects);
  const subjects = await Promise.all(baseSubjects.map(enrichFileFacts));
  const payload = {
    inventory_version: 'task-011-illustration-inventory-v1',
    generated_from: {
      card_catalog_version: cards.card_catalog_version,
      domain_content_version: domain.domain_content_version,
      asset_manifest_version: manifest.asset_manifest_version,
    },
    expected_counts: counts,
    total_subjects: subjects.length,
    subjects,
  };
  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const inventory = await buildTask011ArtInventory();
  const pending = inventory.subjects.filter((subject) => subject.review_state !== 'approved').length;
  console.log(`Wrote ${inventory.total_subjects} TASK-011 subjects (${pending} pending review).`);
}
