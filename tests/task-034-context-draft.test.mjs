import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  buildCandidateRouteReview,
  buildQuietCascadeContextDraft,
  buildQuietCascadeContextLedger,
  buildQuietCascadePayloadLedger,
  contextSourceData,
  renderQuietCascadeContextChangelog,
  renderQuietCascadeContextComprehensionReview,
  renderQuietCascadeContextTranscripts,
  validateQuietCascadeContextDraft,
} from '../src/story/quiet-cascade-context.mjs';
import { traverseQuietCascadeRoutes } from '../src/story/quiet-cascade-report.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const CAMPAIGN_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade');
const REVISION_ROOT = path.join(ROOT, 'docs/story/revisions/quiet-cascade-characterization-v2');
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

function loadBundle() {
  const manifest = readJson(path.join(CAMPAIGN_ROOT, 'manifest.json'));
  return {
    manifest,
    registry: readJson(path.join(CAMPAIGN_ROOT, manifest.registry)),
    texts: { en: readJson(path.join(CAMPAIGN_ROOT, manifest.text_catalogs.en)) },
    scripts: manifest.scripts.map((filename) => readJson(path.join(CAMPAIGN_ROOT, filename))),
  };
}

function productionHashes() {
  return Object.fromEntries(Object.keys(contextSourceData().production_hashes).map((relativePath) => [
    relativePath,
    createHash('sha256').update(fs.readFileSync(path.join(CAMPAIGN_ROOT, relativePath))).digest('hex'),
  ]));
}

const bundle = loadBundle();
const matchRegistry = readJson(path.join(CAMPAIGN_ROOT, 'matches.json'));
const routes = traverseQuietCascadeRoutes(bundle, matchRegistry);
const ledger = readJson(path.join(ROOT, 'docs/story/reports/QUIET_CASCADE_CONTEXT_LEDGER.json'));
const draft = readJson(path.join(REVISION_ROOT, 'context-draft.en.json'));
const payload = readJson(path.join(REVISION_ROOT, 'CONTEXT_PAYLOAD_LEDGER.json'));

test('TASK-034 candidate and payload ledgers are deterministic and completely valid', () => {
  const generatedDraft = buildQuietCascadeContextDraft(bundle, matchRegistry, routes, ledger);
  const generatedPayload = buildQuietCascadePayloadLedger(generatedDraft, ledger);
  assert.deepEqual(draft, generatedDraft);
  assert.deepEqual(payload, generatedPayload);
  assert.deepEqual(validateQuietCascadeContextDraft(
    draft, payload, ledger, bundle, matchRegistry, routes, productionHashes(),
  ), []);
  assert.deepEqual(draft.totals, {
    additive_lines: 11,
    candidate_lines: 124,
    context_gaps: 13,
    original_text_surfaces: 113,
    replacement_lines: 113,
    resolved_gaps: 13,
    revised_replacement_lines: 74,
    routes: 48,
    unchanged_replacement_lines: 39,
  });
  assert.deepEqual(payload.totals, { additive_lines: 11, payload_lines: 124, replacement_lines: 113, routes: 48 });
  assert.equal(draft.comprehension_review.length, 20);
  assert.ok(draft.comprehension_review.every((row) => row.status === 'ANSWERED_FROM_CANDIDATE_TRANSCRIPTS'));
  assert.deepEqual(draft.review_summary, {
    localization_readiness: { fragment_splicing_required: false, inline_newline_count: 0, stable_text_ids: true },
    mobile_density: { allowed_characters_per_line: 420, maximum_characters: 286, maximum_words: 43, over_limit_lines: 0 },
    repetition_and_pacing: { additive_lines_are_distributed_across_chapters: true, exact_duplicate_texts: 0, maximum_additive_lines_on_one_route: 10 },
    safety_and_accuracy: { comprehension_questions_answered: 20, comprehension_questions_total: 20, hidden_entity_id_leaks: 0, production_files_sha256_pinned: true, shaming_language_hits: 0 },
  });
});

test('the candidate preserves every production mapping and pins byte-identical live topology', () => {
  assert.deepEqual(productionHashes(), contextSourceData().production_hashes);
  assert.equal(draft.candidate_boundary, 'NON_LIVE_REVIEW_LAYER');
  assert.equal(draft.topology_contract.production_files_untouched, true);
  assert.equal(draft.replacements.length, 113);
  assert.equal(new Set(draft.replacements.map((row) => row.text_id)).size, 113);
  assert.ok(draft.replacements.every((row) => bundle.texts.en.entries[row.text_id] === row.original_text));
  assert.deepEqual(draft.topology_contract.preserved_ids,
    ['labels', 'choices', 'variables', 'checkpoints', 'endings', 'match_refs', 'graph_nodes']);
});

test('additive proposals have unique stable IDs, known anchors, and reachable route coverage', () => {
  const productionStatementIds = new Set(bundle.scripts.flatMap((script) => script.statements)
    .map((statement) => statement.statement_id).filter(Boolean));
  const ids = draft.additions.flatMap((row) => [row.candidate_id, row.statement_id, row.text_id]);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(draft.additions.every((row) => productionStatementIds.has(row.anchor.statement_id)));
  assert.ok(draft.additions.every((row) => ['BEFORE', 'AFTER'].includes(row.anchor.placement)));
  assert.ok(draft.additions.every((row) => row.route_coverage.length > 0));
  assert.ok(draft.additions.every((row) => row.gap_ids.length > 0));
});

test('every context gap and every candidate line has a locked, bounded payload', () => {
  assert.equal(draft.gap_resolutions.length, 13);
  assert.ok(draft.gap_resolutions.every((row) => row.status === 'RESOLVED_IN_CANDIDATE'));
  assert.ok(draft.gap_resolutions.every((row) => row.resolution_candidate_ids.length > 0));
  assert.equal(payload.line_payloads.length, 124);
  assert.equal(new Set(payload.line_payloads.map((row) => row.candidate_id)).size, 124);
  assert.ok(payload.line_payloads.every((row) => row.immutable_semantic_payload.length > 0));
  assert.ok(payload.line_payloads.every((row) => row.technical_sources.length > 0));
  assert.ok(payload.line_payloads.every((row) => row.voice_flexibility.must_preserve.includes('gameplay authority')));
  assert.ok(payload.line_payloads.filter((row) => row.line_kind === 'REPLACEMENT')
    .every((row) => row.source_text === draft.replacements.find((source) => source.text_id === row.candidate_id).original_text));
});

test('all 48 candidate transcripts are deterministic and first-use-safe', () => {
  const reviews = buildCandidateRouteReview(routes, draft);
  assert.equal(reviews.length, 48);
  assert.equal(new Set(reviews.map((route) => route.route_id)).size, 48);
  assert.equal(new Set(reviews.map((route) => route.ending_id)).size, 3);
  assert.ok(reviews.every((route) => route.entries.length > 0));
  const transcript = fs.readFileSync(path.join(REVISION_ROOT, 'CONTEXT_ROUTE_TRANSCRIPTS.md'), 'utf8');
  assert.equal(transcript, renderQuietCascadeContextTranscripts(routes, draft));
  assert.equal((transcript.match(/^## `route\./gm) ?? []).length, 48);
  assert.equal(
    fs.readFileSync(path.join(REVISION_ROOT, 'CONTEXT_CHANGELOG.md'), 'utf8'),
    renderQuietCascadeContextChangelog(draft),
  );
  const comprehension = fs.readFileSync(path.join(REVISION_ROOT, 'CONTEXT_COMPREHENSION_REVIEW.md'), 'utf8');
  assert.equal(comprehension, renderQuietCascadeContextComprehensionReview(draft));
  assert.equal((comprehension.match(/Status: \*\*ANSWERED_FROM_CANDIDATE_TRANSCRIPTS\*\*/g) ?? []).length, 20);
});

test('candidate copy is mobile-bounded, localization-ready, non-shaming, and free of hidden entity IDs', () => {
  const lines = payload.line_payloads.map((row) => row.text);
  assert.ok(lines.every((line) => line.length >= 1 && line.length <= 420));
  assert.ok(lines.every((line) => !line.includes('\n')));
  assert.ok(lines.every((line) => line.trim() === line));
  assert.ok(lines.every((line) => line.split(/\s+/).length <= 75));
  const serialized = lines.join('\n');
  assert.doesNotMatch(serialized, /fault\.[a-z0-9._-]+/i);
  assert.doesNotMatch(serialized, /card\.(?:bench|response)\.[a-z0-9._-]+/i);
  assert.doesNotMatch(serialized, /fingerprint\.[a-z0-9._-]+/i);
  assert.doesNotMatch(serialized, /(?:stupid|idiot|incompetent|careless|obvious mistake)/i);
  for (const addition of draft.additions) {
    assert.equal(payload.line_payloads.find((row) => row.candidate_id === addition.candidate_id)
      .localization_and_density.no_fragment_splicing, true);
  }
});
