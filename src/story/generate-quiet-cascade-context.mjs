import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  buildQuietCascadeContextDraft,
  buildQuietCascadeContextLedger,
  buildQuietCascadePayloadLedger,
  contextSourceData,
  renderQuietCascadeComprehensionQuestions,
  renderQuietCascadeContextAudit,
  renderQuietCascadeContextChangelog,
  renderQuietCascadeContextComprehensionReview,
  renderQuietCascadeContextTranscripts,
  validateQuietCascadeContextDraft,
  validateQuietCascadeContextLedger,
} from './quiet-cascade-context.mjs';
import { traverseQuietCascadeRoutes } from './quiet-cascade-report.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CAMPAIGN_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade');
const CAMPAIGN_DOC_ROOT = path.join(ROOT, 'docs/story/campaigns');
const REPORT_ROOT = path.join(ROOT, 'docs/story/reports');
const REVISION_ROOT = path.join(ROOT, 'docs/story/revisions/quiet-cascade-characterization-v2');

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalize(value[key])]));
  }
  return value;
}

const stableJson = (value) => `${JSON.stringify(normalize(value), null, 2)}\n`;

async function loadBundle() {
  const manifest = await readJson(path.join(CAMPAIGN_ROOT, 'manifest.json'));
  return {
    manifest,
    registry: await readJson(path.join(CAMPAIGN_ROOT, manifest.registry)),
    texts: { en: await readJson(path.join(CAMPAIGN_ROOT, manifest.text_catalogs.en)) },
    scripts: await Promise.all(manifest.scripts.map((filename) => readJson(path.join(CAMPAIGN_ROOT, filename)))),
  };
}

async function productionHashes() {
  const expected = contextSourceData().production_hashes;
  const entries = await Promise.all(Object.keys(expected).map(async (relativePath) => {
    const bytes = await fs.readFile(path.join(CAMPAIGN_ROOT, relativePath));
    return [relativePath, createHash('sha256').update(bytes).digest('hex')];
  }));
  return Object.fromEntries(entries);
}

const [bundle, matchRegistry, actualHashes] = await Promise.all([
  loadBundle(),
  readJson(path.join(CAMPAIGN_ROOT, 'matches.json')),
  productionHashes(),
]);
const routes = traverseQuietCascadeRoutes(bundle, matchRegistry);
const ledger = buildQuietCascadeContextLedger(bundle, matchRegistry, routes);
const draft = buildQuietCascadeContextDraft(bundle, matchRegistry, routes, ledger);
const payload = buildQuietCascadePayloadLedger(draft, ledger);
const issues = [
  ...validateQuietCascadeContextLedger(ledger, bundle, matchRegistry, routes),
  ...validateQuietCascadeContextDraft(draft, payload, ledger, bundle, matchRegistry, routes, actualHashes),
];

if (issues.length) {
  throw new Error(`Quiet Cascade context generation failed:\n- ${issues.join('\n- ')}`);
}

await Promise.all([
  fs.mkdir(CAMPAIGN_DOC_ROOT, { recursive: true }),
  fs.mkdir(REPORT_ROOT, { recursive: true }),
  fs.mkdir(REVISION_ROOT, { recursive: true }),
]);

await Promise.all([
  fs.writeFile(path.join(CAMPAIGN_DOC_ROOT, 'QUIET_CASCADE_CONTEXT_AUDIT.md'), renderQuietCascadeContextAudit(ledger), 'utf8'),
  fs.writeFile(path.join(REPORT_ROOT, 'QUIET_CASCADE_CONTEXT_LEDGER.json'), stableJson(ledger), 'utf8'),
  fs.writeFile(path.join(REPORT_ROOT, 'QUIET_CASCADE_COMPREHENSION_QUESTIONS.md'), renderQuietCascadeComprehensionQuestions(), 'utf8'),
  fs.writeFile(path.join(REVISION_ROOT, 'context-draft.en.json'), stableJson(draft), 'utf8'),
  fs.writeFile(path.join(REVISION_ROOT, 'CONTEXT_CHANGELOG.md'), renderQuietCascadeContextChangelog(draft), 'utf8'),
  fs.writeFile(path.join(REVISION_ROOT, 'CONTEXT_COMPREHENSION_REVIEW.md'), renderQuietCascadeContextComprehensionReview(draft), 'utf8'),
  fs.writeFile(path.join(REVISION_ROOT, 'CONTEXT_ROUTE_TRANSCRIPTS.md'), renderQuietCascadeContextTranscripts(routes, draft), 'utf8'),
  fs.writeFile(path.join(REVISION_ROOT, 'CONTEXT_PAYLOAD_LEDGER.json'), stableJson(payload), 'utf8'),
]);

console.log(JSON.stringify({
  audited_say: ledger.totals.production_say_statements,
  audited_narrate: ledger.totals.production_narrate_statements,
  audited_choices: ledger.totals.choice_prompts,
  audited_choice_options: ledger.totals.choice_options,
  audited_match_bridges: ledger.totals.match_bridges,
  reconciled_surfaces: ledger.totals.reconciled_text_surfaces,
  routes: ledger.totals.audited_routes,
  terminal_variants: ledger.totals.terminal_variants,
  context_gaps: ledger.totals.context_records,
  replacement_lines: draft.totals.replacement_lines,
  revised_lines: draft.totals.revised_replacement_lines,
  unchanged_lines: draft.totals.unchanged_replacement_lines,
  additive_lines: draft.totals.additive_lines,
  candidate_lines: draft.totals.candidate_lines,
  validation_issues: issues.length,
}, null, 2));
