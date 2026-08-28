import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  QUIET_CASCADE_CHARACTERIZATION_VERSION,
  QUIET_CASCADE_FINAL_OVERRIDES,
  QUIET_CASCADE_PERSONAL_TEXTURE_IDS,
} from './quiet-cascade-characterization.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const SOURCE_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade');
const TARGET_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade-characterization-v2');
const REVISION_ROOT = path.join(ROOT, 'docs/story/revisions/quiet-cascade-characterization-v2');
const DRAFT_PATH = path.join(REVISION_ROOT, 'context-draft.en.json');

const json = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));
const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const hash = (value) => createHash('sha256').update(value).digest('hex');
const escapeCell = (value) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');

function finalText(candidateId, draftText) {
  return QUIET_CASCADE_FINAL_OVERRIDES[candidateId] ?? draftText;
}

function additionStatement(addition) {
  if (addition.kind === 'NARRATION') {
    return {
      type: 'narrate',
      statement_id: addition.statement_id,
      text_id: addition.text_id,
      style_key: 'NARRATION',
    };
  }
  return {
    type: 'say',
    statement_id: addition.statement_id,
    speaker_key: addition.speaker_key,
    text_id: addition.text_id,
    style_key: 'DIALOGUE',
  };
}

function integrateAdditions(script, additions) {
  const byAnchor = new Map();
  for (const addition of additions) {
    const key = `${addition.anchor.placement}:${addition.anchor.statement_id}`;
    const existing = byAnchor.get(key) ?? [];
    existing.push(addition);
    byAnchor.set(key, existing);
  }
  const encountered = new Set();
  const statements = [];
  for (const statement of script.statements) {
    for (const addition of byAnchor.get(`BEFORE:${statement.statement_id}`) ?? []) {
      statements.push(additionStatement(addition));
      encountered.add(addition.candidate_id);
    }
    statements.push(statement);
    for (const addition of byAnchor.get(`AFTER:${statement.statement_id}`) ?? []) {
      statements.push(additionStatement(addition));
      encountered.add(addition.candidate_id);
    }
  }
  const expected = additions.map((entry) => entry.candidate_id).sort();
  const actual = [...encountered].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Not every TASK-034 addition anchor resolved in ${script.script_id}.`);
  }
  return { ...script, statements };
}

function comparisonRows(draft) {
  const rows = draft.replacements.map((entry) => ({
    candidate_id: entry.text_id,
    text_id: entry.text_id,
    statement_id: entry.statement_id,
    chapter_id: entry.chapter_id,
    label_id: entry.label_id,
    source_kind: entry.source_kind,
    speaker_or_source: entry.speaker_or_source,
    original: entry.original_text,
    context_draft: entry.draft_text,
    final: finalText(entry.text_id, entry.draft_text),
    gap_ids: entry.gap_ids,
    route_coverage: entry.route_coverage,
    personal_texture: QUIET_CASCADE_PERSONAL_TEXTURE_IDS.includes(entry.text_id),
  }));
  for (const entry of draft.additions) {
    rows.push({
      candidate_id: entry.candidate_id,
      text_id: entry.text_id,
      statement_id: entry.statement_id,
      chapter_id: entry.chapter_id,
      label_id: entry.label_id,
      source_kind: entry.kind === 'DIALOGUE' ? 'SAY' : 'NARRATE',
      speaker_or_source: entry.speaker_key ?? 'NARRATION',
      original: null,
      context_draft: entry.text,
      final: finalText(entry.candidate_id, entry.text),
      gap_ids: entry.gap_ids,
      route_coverage: entry.route_coverage,
      personal_texture: QUIET_CASCADE_PERSONAL_TEXTURE_IDS.includes(entry.candidate_id),
    });
  }
  return rows;
}

function renderComparison(rows) {
  const lines = [
    '# Quiet Cascade final dialogue comparison',
    '',
    `Content version: \`${QUIET_CASCADE_CHARACTERIZATION_VERSION}\``,
    '',
    'All 113 original surfaces and eleven TASK-034 additions are shown. `(addition)` means no v1 line occupied that structural position. TASK-034 remains the semantic floor; a final line that equals its context draft was reviewed and retained as already voice-compatible.',
    '',
    '| Candidate / text ID | Speaker/source | Original v1 | TASK-034 context draft | TASK-036 final | Texture |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  for (const row of rows) {
    lines.push(`| \`${row.candidate_id}\` | ${escapeCell(row.speaker_or_source)} | ${escapeCell(row.original ?? '(addition)')} | ${escapeCell(row.context_draft)} | ${escapeCell(row.final)} | ${row.personal_texture ? 'yes' : 'no'} |`);
  }
  return `${lines.join('\n')}\n`;
}

function renderRouteComparisons(rows, routeIds) {
  const lines = [
    '# Quiet Cascade final route transcript comparison',
    '',
    'Each deterministic route lists its reachable displayed copy in source order with original v1, TASK-034 context draft, and TASK-036 final text side by side. Additions have no original counterpart. Structural and Match statements are intentionally absent because this report reviews displayed language; route topology is proved separately.',
    '',
  ];
  for (const routeId of routeIds) {
    lines.push(`## ${routeId}`, '', '| ID | Speaker/source | Original v1 | Context draft | Final |', '| --- | --- | --- | --- | --- |');
    for (const row of rows.filter((entry) => entry.route_coverage.includes(routeId))) {
      lines.push(`| \`${row.candidate_id}\` | ${escapeCell(row.speaker_or_source)} | ${escapeCell(row.original ?? '(addition)')} | ${escapeCell(row.context_draft)} | ${escapeCell(row.final)} |`);
    }
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

const [manifest, textCatalog, draft] = await Promise.all([
  json(path.join(SOURCE_ROOT, 'manifest.json')),
  json(path.join(SOURCE_ROOT, 'texts/en.json')),
  json(DRAFT_PATH),
]);

if (manifest.content_version !== draft.source_content_version) {
  throw new Error('TASK-034 source version no longer matches the preserved v1 campaign.');
}
if (draft.replacements.length !== 113 || draft.additions.length !== 11) {
  throw new Error('TASK-034 candidate inventory changed unexpectedly.');
}

const scripts = await Promise.all(manifest.scripts.map((relative) => json(path.join(SOURCE_ROOT, relative))));
const additionsByChapter = Map.groupBy(draft.additions, (entry) => entry.chapter_id);
const integratedScripts = scripts.map((script) => integrateAdditions(
  script,
  additionsByChapter.get(script.chapter_id) ?? [],
));
const rows = comparisonRows(draft);
const finalEntries = { ...textCatalog.entries };
for (const row of rows) finalEntries[row.text_id] = row.final;

const finalManifest = {
  ...manifest,
  content_version: QUIET_CASCADE_CHARACTERIZATION_VERSION,
};
const finalCatalog = {
  ...textCatalog,
  entries: finalEntries,
};

await fs.rm(TARGET_ROOT, { recursive: true, force: true });
await Promise.all([
  fs.mkdir(path.join(TARGET_ROOT, 'scripts'), { recursive: true }),
  fs.mkdir(path.join(TARGET_ROOT, 'texts'), { recursive: true }),
  fs.mkdir(REVISION_ROOT, { recursive: true }),
]);
await Promise.all([
  fs.copyFile(path.join(SOURCE_ROOT, 'graph.json'), path.join(TARGET_ROOT, 'graph.json')),
  fs.copyFile(path.join(SOURCE_ROOT, 'matches.json'), path.join(TARGET_ROOT, 'matches.json')),
  fs.copyFile(path.join(SOURCE_ROOT, 'registry.json'), path.join(TARGET_ROOT, 'registry.json')),
  fs.writeFile(path.join(TARGET_ROOT, 'manifest.json'), stableJson(finalManifest), 'utf8'),
  fs.writeFile(path.join(TARGET_ROOT, 'texts/en.json'), stableJson(finalCatalog), 'utf8'),
  ...integratedScripts.map((script, index) => fs.writeFile(
    path.join(TARGET_ROOT, manifest.scripts[index]),
    stableJson(script),
    'utf8',
  )),
]);

const routeIds = [...new Set(rows.flatMap((row) => row.route_coverage))];
const report = {
  schema_version: 'quiet-cascade-final-dialogue-comparison-v1',
  campaign_id: manifest.pack_id,
  source_content_version: manifest.content_version,
  candidate_version: draft.candidate_version,
  final_content_version: QUIET_CASCADE_CHARACTERIZATION_VERSION,
  semantic_payload_amendments: [],
  texture_policy: {
    marked_dialogue_moments: QUIET_CASCADE_PERSONAL_TEXTURE_IDS.length,
    final_dialogue_moments: integratedScripts.flatMap((script) => script.statements)
      .filter((statement) => statement.type === 'say').length,
    marked_candidate_ids: QUIET_CASCADE_PERSONAL_TEXTURE_IDS,
  },
  totals: {
    comparisons: rows.length,
    original_surfaces: rows.filter((row) => row.original !== null).length,
    additions: rows.filter((row) => row.original === null).length,
    context_revisions: rows.filter((row) => row.original !== row.context_draft).length,
    voice_revisions: rows.filter((row) => row.context_draft !== row.final).length,
    final_changes_from_v1: rows.filter((row) => row.original !== row.final).length,
    routes: routeIds.length,
  },
  topology_sha256: {
    graph: hash(await fs.readFile(path.join(TARGET_ROOT, 'graph.json'))),
    matches: hash(await fs.readFile(path.join(TARGET_ROOT, 'matches.json'))),
    registry: hash(await fs.readFile(path.join(TARGET_ROOT, 'registry.json'))),
  },
  rows,
};

await Promise.all([
  fs.writeFile(path.join(REVISION_ROOT, 'FINAL_DIALOGUE_COMPARISON.json'), stableJson(report), 'utf8'),
  fs.writeFile(path.join(REVISION_ROOT, 'FINAL_DIALOGUE_COMPARISON.md'), renderComparison(rows), 'utf8'),
  fs.writeFile(path.join(REVISION_ROOT, 'FINAL_ROUTE_TRANSCRIPTS.md'), renderRouteComparisons(rows, routeIds), 'utf8'),
]);

console.log(JSON.stringify(report.totals, null, 2));
