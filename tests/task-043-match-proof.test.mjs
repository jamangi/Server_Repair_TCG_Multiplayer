import assert from 'node:assert/strict';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { stableJson } from '../src/simulation/artifacts.mjs';
import {
  TASK_043_EXPECTED_TICKET_PINS,
  TASK_043_MATCH_REGISTRY_VERSION,
  TASK_043_OUTPUT_ROOT,
  TASK_043_OUTPUTS,
  buildTask043MatchArtifacts,
} from '../src/story/generate-task-043-match-proof.mjs';
import { loadSchemaRegistry, validateJsonSchema } from './helpers/json-schema-validator.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const EXPECTED_REFS = [
  'story.match.qc02.shift07.socket_contacts',
  'story.match.qc02.shift08.power_distribution',
  'story.match.qc02.shift09.predictive_drive',
  'story.match.qc02.shift10.stale_alert',
  'story.match.qc02.shift11.firmware_regression',
  'story.match.qc02.shift12.bmc_recovery',
];

function loadStorySchemaRegistry() {
  const schemas = ['schemas/story', 'schemas/client'].flatMap((relativeDirectory) => {
    const directory = path.join(ROOT, relativeDirectory);
    return fsSync.readdirSync(directory)
      .filter((name) => name.endsWith('.json'))
      .sort()
      .map((name) => ({
        filePath: path.join(directory, name),
        schema: JSON.parse(fsSync.readFileSync(path.join(directory, name), 'utf8')),
      }));
  });
  return { schemas, byId: new Map(schemas.map(({ schema }) => [schema.$id, schema])) };
}

let artifacts;

test.before(async () => {
  artifacts = await buildTask043MatchArtifacts();
});

test('registers exactly six non-live QC02 Matches under the existing durable campaign identity', () => {
  assert.equal(artifacts.registry.match_configuration_version, TASK_043_MATCH_REGISTRY_VERSION);
  assert.equal(artifacts.registry.campaign_id, 'story.campaign.quiet_cascade.v1');
  assert.equal(artifacts.registry.content_version, 'quiet-cascade-expansion-v3');
  assert.equal(artifacts.registry.status, 'CANDIDATE_NON_LIVE');
  assert.equal(artifacts.registry.live_loader_eligible, false);
  assert.deepEqual(artifacts.registry.matches.map((entry) => entry.match_ref), EXPECTED_REFS);
  assert.deepEqual(artifacts.registry.matches.map((entry) => entry.shift_id), [
    'story.shift.qc02.07',
    'story.shift.qc02.08',
    'story.shift.qc02.09',
    'story.shift.qc02.10',
    'story.shift.qc02.11',
    'story.shift.qc02.12',
  ]);
});

test('pins story seeds, Builder configurations, one Ticket per Match, and exact Ticket identities', () => {
  const schemaRegistry = loadSchemaRegistry(ROOT);
  const schema = schemaRegistry.schemas.find(({ schema: candidate }) => candidate.title === 'Ticket Builder Configuration').schema;
  for (const [index, entry] of artifacts.registry.matches.entries()) {
    const expected = TASK_043_EXPECTED_TICKET_PINS[entry.match_ref];
    assert.equal(entry.seed, `story.quiet_cascade.expansion.s${String(index + 7).padStart(2, '0')}.v1`);
    assert.equal(entry.requested_ticket_count, 1);
    assert.deepEqual(entry.expected_ticket_definition_ids, [expected.ticket_id]);
    assert.deepEqual(entry.expected_ticket_snapshot_digests, [expected.digest]);
    assert.deepEqual(validateJsonSchema(entry.builder_configuration, schema, schemaRegistry), [], entry.match_ref);
    assert.equal(entry.builder_configuration.scenario_or_mode_context, 'CAMPAIGN');
    assert.equal(entry.builder_configuration.requested_ticket_count, 1);
    assert.equal(entry.builder_configuration.seed, entry.seed);
    assert.deepEqual(entry.builder_configuration.allowed_fingerprint_ids, entry.allowed_fingerprint_ids);
    assert.equal(entry.builder_configuration.diagnostic_card_definition_ids.length, 50);
  }
});

test('separates all legal, relevant, required, and optional diagnostics and requires no Command in an oracle-minimal route', () => {
  assert.equal(artifacts.builderProof.matches.length, 6);
  assert.equal(artifacts.builderProof.diagnostic_bench_card_count, 50);
  assert.equal(artifacts.builderProof.all_minimal_witness_command_sets_empty, true);
  for (const entry of artifacts.builderProof.matches) {
    const diagnostics = entry.legal_relevant_required_optional_diagnostics;
    assert.equal(diagnostics.legal.card_definition_ids.length, 50, entry.match_ref);
    assert.ok(diagnostics.relevant.card_definition_ids.length >= diagnostics.required.card_definition_ids.length, entry.match_ref);
    assert.ok(diagnostics.required.card_definition_ids.length >= 1, entry.match_ref);
    assert.equal(
      diagnostics.relevant.card_definition_ids.length,
      diagnostics.required.card_definition_ids.length + diagnostics.optional_relevant.card_definition_ids.length,
      entry.match_ref,
    );
    assert.equal(
      diagnostics.legal.card_definition_ids.length,
      diagnostics.relevant.card_definition_ids.length + diagnostics.legal_not_relevant.card_definition_ids.length,
      entry.match_ref,
    );
    assert.deepEqual(diagnostics.commands.minimal_witness_required_ids, [], entry.match_ref);
    assert.ok(entry.response_path.oracle_witness.some((step) => step.action === 'COMMIT_ISOLATION'), entry.match_ref);
    assert.ok(entry.response_path.oracle_witness.some((step) => step.action === 'PERFORM_REPAIR'), entry.match_ref);
    assert.ok(entry.response_path.oracle_witness.some((step) => step.action === 'PERFORM_VERIFY'), entry.match_ref);
    assert.deepEqual(entry.response_path.document, {
      action_type: 'PUBLISH_CLOSURE',
      required_card_copies: 0,
      effect: 'LOCK_WORKLOG_AND_ARCHIVE_TICKET',
    });
  }
});

test('proves the exact 30-Card response deck has two Repair and one Verify copy of headroom per Match', () => {
  assert.equal(artifacts.builderProof.exact_response_deck_id, 'deck.story.expansion_response_v1');
  assert.equal(artifacts.builderProof.exact_response_deck_size, 30);
  for (const entry of artifacts.builderProof.matches) {
    assert.deepEqual(entry.deck_pressure.repair, {
      card_definition_id: entry.response_path.repair.card_definition_id,
      available_copies: 3,
      required_copies: 1,
      headroom_copies: 2,
    });
    assert.deepEqual(entry.deck_pressure.verify, {
      card_definition_id: entry.response_path.verify.card_definition_id,
      available_copies: 2,
      required_copies: 1,
      headroom_copies: 1,
    });
    assert.equal(entry.deck_pressure.feasible, true);
  }
});

test('runs six real Builder-backed engine Matches to reproducible successful closure', () => {
  assert.equal(artifacts.campaign.matches.length, 6);
  assert.equal(artifacts.campaign.summary.overall.succeeded, 6);
  assert.equal(artifacts.campaign.summary.overall.failed, 0);
  assert.equal(artifacts.campaign.summary.determinism.mismatches, 0);
  for (const entry of artifacts.builderProof.matches) {
    assert.equal(entry.builder.status, 'SUCCESS', entry.match_ref);
    assert.equal(entry.builder.deterministic_repeat_identical, true, entry.match_ref);
    assert.equal(entry.builder.outcome_coverage_valid, true, entry.match_ref);
    assert.equal(entry.builder.solvability_valid, true, entry.match_ref);
    assert.equal(entry.engine.classification, 'SUCCEEDED', entry.match_ref);
    assert.equal(entry.engine.deterministic_rerun_identical, true, entry.match_ref);
    assert.equal(entry.engine.tickets_closed, 1, entry.match_ref);
    assert.ok(entry.engine.contribution_counts.repairs >= 1, entry.match_ref);
    assert.ok(entry.engine.contribution_counts.verifies >= 1, entry.match_ref);
    assert.equal(entry.engine.contribution_counts.closures, 1, entry.match_ref);
    assert.equal(entry.engine.normalized_completed_result.completion, 'COMPLETED', entry.match_ref);
    assert.equal(entry.engine.normalized_completed_result.story_service_points_gained, 2, entry.match_ref);
    assert.equal(entry.engine.normalized_completed_result.documented_outcome, true, entry.match_ref);
    assert.equal(entry.engine.normalized_completed_result.contributions.documentation_actions, 1, entry.match_ref);
  }
});

test('pins checkpoint-safe entry, launch, return, success, and abandon boundaries', () => {
  const schemaRegistry = loadStorySchemaRegistry();
  const schemas = new Map(schemaRegistry.schemas.map(({ schema }) => [schema.title, schema]));
  const checkpointSchema = schemas.get('Durable Story checkpoint v1');
  const resultSchema = schemas.get('Normalized Story Match result v1');
  assert.equal(artifacts.checkpointProof.matches.length, 6);
  for (const [index, entry] of artifacts.checkpointProof.matches.entries()) {
    const shift = String(index + 7).padStart(2, '0');
    assert.equal(entry.entry_label, `story.qc02.shift${shift}.entry`);
    assert.equal(entry.launch_label, `story.qc02.shift${shift}.match`);
    assert.equal(entry.return_label, `story.qc02.shift${shift}.return`);
    assert.equal(entry.completed_label, `story.qc02.shift${shift}.success`);
    assert.equal(entry.abandoned_label, `story.qc02.shift${shift}.abandon`);
    assert.equal(entry.pre_match_checkpoint_id, `checkpoint.qc02.shift${shift}.pre_match`);
    assert.equal(entry.post_match_checkpoint_id, `checkpoint.qc02.shift${shift}.post_match`);
    assert.equal(entry.interruption_behavior, 'RESTORE_PRE_MATCH_CHECKPOINT_AND_RELAUNCH_FRESH_MATCH');
    assert.equal(entry.active_match_resumption_supported, false);
    for (const checkpoint of Object.values(entry.isolated_schema_examples)) {
      assert.deepEqual(validateJsonSchema(checkpoint, checkpointSchema, schemaRegistry), [], `${entry.match_ref}:${checkpoint.checkpoint_id}`);
    }
    assert.deepEqual(validateJsonSchema(entry.isolated_schema_examples.post_completed.match_results[0], resultSchema, schemaRegistry), []);
    assert.deepEqual(validateJsonSchema(entry.isolated_schema_examples.post_abandoned.match_results[0], resultSchema, schemaRegistry), []);
  }
});

test('commits byte-stable settings, engine results, reports, registry, and proof artifacts', async () => {
  const expected = new Map([
    [TASK_043_OUTPUTS.settings, stableJson(artifacts.settings)],
    [TASK_043_OUTPUTS.matches, stableJson(artifacts.campaign.matches)],
    [TASK_043_OUTPUTS.summary, stableJson(artifacts.campaign.summary)],
    [TASK_043_OUTPUTS.summaryMarkdown, artifacts.campaign.summary_markdown],
    [TASK_043_OUTPUTS.registry, stableJson(artifacts.registry)],
    [TASK_043_OUTPUTS.builderProof, stableJson(artifacts.builderProof)],
    [TASK_043_OUTPUTS.checkpointProof, stableJson(artifacts.checkpointProof)],
  ]);
  for (const [filePath, contents] of expected) {
    assert.equal(await fs.readFile(filePath, 'utf8'), contents, path.relative(ROOT, filePath));
  }
  assert.deepEqual((await fs.readdir(path.join(TASK_043_OUTPUT_ROOT, 'exceptions'))).filter((name) => name.endsWith('.json')), []);
});
