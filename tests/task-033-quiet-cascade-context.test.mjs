import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  buildQuietCascadeContextLedger,
  collectQuietCascadeNarrativeInventory,
  renderQuietCascadeComprehensionQuestions,
  renderQuietCascadeContextAudit,
  validateQuietCascadeContextLedger,
} from '../src/story/quiet-cascade-context.mjs';
import { traverseQuietCascadeRoutes } from '../src/story/quiet-cascade-report.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const CAMPAIGN_ROOT = path.join(ROOT, 'content/story-v1/campaigns/quiet-cascade');
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

const bundle = loadBundle();
const matchRegistry = readJson(path.join(CAMPAIGN_ROOT, 'matches.json'));
const routes = traverseQuietCascadeRoutes(bundle, matchRegistry);
const ledgerPath = path.join(ROOT, 'docs/story/reports/QUIET_CASCADE_CONTEXT_LEDGER.json');
const ledger = readJson(ledgerPath);

test('TASK-033 context ledger is deterministic, schema-complete, and valid', () => {
  const generated = buildQuietCascadeContextLedger(bundle, matchRegistry, routes);
  assert.deepEqual(ledger, generated);
  assert.deepEqual(validateQuietCascadeContextLedger(ledger, bundle, matchRegistry, routes), []);
  assert.equal(ledger.schema_version, 'quiet-cascade-context-ledger-v1');
  assert.deepEqual(ledger.totals.severity, { BLOCKING: 4, MATERIAL: 8, POLISH: 1 });
  assert.equal(ledger.concept_records.length, 13);

  for (const gap of ledger.concept_records) {
    for (const field of [
      'gap_id', 'chapter_id', 'label_id', 'route_conditions', 'first_reachable_statement_id',
      'text_id', 'speaker_or_source', 'term_procedure_or_pain_point', 'assumed_knowledge',
      'reader_model_rationale', 'severity', 'recommended_channel', 'semantic_payload',
      'audit_status', 'rationale',
    ]) assert.ok(gap[field], `${gap.gap_id} missing ${field}`);
    assert.ok(['BEFORE', 'AFTER', 'REVISE'].includes(gap.insertion_or_revision_anchor.placement));
    assert.ok(gap.insertion_or_revision_anchor.statement_id);
    assert.ok(gap.hidden_information_guardrails.length);
    assert.ok(gap.gameplay_authority_guardrails.length);
    assert.ok(Array.isArray(gap.related_later_text_ids));
    assert.deepEqual(Object.keys(gap.current_context_ladder).sort(),
      ['action', 'consequence', 'failure', 'insight', 'name', 'normal']);
  }
});

test('all production narrative, choice, and Match-bridge text is reconciled exactly once', () => {
  const inventory = collectQuietCascadeNarrativeInventory(bundle, matchRegistry, routes);
  assert.deepEqual(ledger.totals, {
    audited_routes: 48,
    choice_options: 8,
    choice_prompts: 4,
    context_records: 13,
    match_bridges: 6,
    no_context_change: 71,
    production_narrate_statements: 5,
    production_say_statements: 90,
    production_story_statements: 324,
    reconciled_text_surfaces: 113,
    severity: { BLOCKING: 4, MATERIAL: 8, POLISH: 1 },
    terminal_variants: 6,
  });
  assert.equal(inventory.length, 113);
  assert.deepEqual(
    ledger.text_reconciliation.map((row) => [row.source_kind, row.source_id, row.text_id]),
    inventory.map((row) => [row.source_kind, row.source_id, row.text_id]),
  );
  assert.ok(ledger.text_reconciliation.every((row) => row.route_coverage.length > 0));
  assert.ok(ledger.text_reconciliation.filter((row) => row.source_kind === 'CHOICE_PROMPT')
    .every((row) => row.route_coverage.length === 48));
  assert.ok(ledger.text_reconciliation.filter((row) => row.source_kind === 'CHOICE_OPTION')
    .every((row) => row.route_coverage.length === 24));
  assert.ok(ledger.text_reconciliation.every((row) => row.disposition === 'NO_CONTEXT_CHANGE'
    || (row.disposition === 'CONTEXT_GAP' && row.gap_ids.length > 0)));
  assert.equal(new Set(routes.map((route) => route.route_id)).size, 48);
  assert.equal(new Set(routes.map((route) => route.ending_id)).size, 3);
});

test('ambiguous first uses are bounded without inventing private or noncanonical meaning', () => {
  const repeaters = ledger.concept_records.find((gap) => gap.gap_id === 'context.qc01.repeaters');
  const sift = ledger.concept_records.find((gap) => gap.gap_id === 'context.qc01.sift_knowledge_systems');
  assert.match(repeaters.semantic_payload, /unit that returns after an earlier release/i);
  assert.match(repeaters.semantic_payload, /one confirmed repeat serial/i);
  assert.match(`${repeaters.assumed_knowledge} ${repeaters.reader_model_rationale}`, /electronics\/network/i);
  assert.match(sift.semantic_payload, /search(?:\/| and )recommendation tool/i);
  assert.doesNotMatch(sift.semantic_payload, /SIFT (?:stands for|means)/i);
  const serialized = JSON.stringify(ledger);
  assert.doesNotMatch(serialized, /fault\.[a-z0-9._-]+/i);
  assert.doesNotMatch(serialized, /card\.(?:bench|response)\.[a-z0-9._-]+/i);
  assert.doesNotMatch(serialized, /fingerprint\.[a-z0-9._-]+/i);
});

test('TASK-033 Markdown reports are generated from the committed ledger and contain 20 public questions', () => {
  const audit = fs.readFileSync(path.join(ROOT, 'docs/story/campaigns/QUIET_CASCADE_CONTEXT_AUDIT.md'), 'utf8');
  const questions = fs.readFileSync(path.join(ROOT, 'docs/story/reports/QUIET_CASCADE_COMPREHENSION_QUESTIONS.md'), 'utf8');
  assert.equal(audit, renderQuietCascadeContextAudit(ledger));
  assert.equal(questions, renderQuietCascadeComprehensionQuestions());
  assert.equal((questions.match(/Expected public-context answer:/g) ?? []).length, 20);
  assert.match(audit, /90 `say` statements, 5 `narrate` statements, 4 choice prompts, 8 visible options, and 6 Match bridges/);
  assert.match(audit, /complete 48-route topology/);
});
