import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {
  TASK_042_OUTPUTS,
  buildTask042Proof,
  generateTask042Report,
  loadTask042Inputs,
  renderTask042Report,
  stableTask042Json,
} from '../src/story/generate-expansion-domain-report.mjs';
import { loadSchemaRegistry, validateJsonSchema } from './helpers/json-schema-validator.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

const EXPECTED_FINGERPRINTS = [
  'fingerprint.compute.damaged_cpu_socket_contacts',
  'fingerprint.power.failed_distribution_board',
  'fingerprint.storage.predictive_drive_failure',
  'fingerprint.management.stale_alert',
  'fingerprint.firmware.incompatible_version_set',
  'fingerprint.management.corrupt_bmc_firmware',
];

const EXPECTED_TICKET_PINS = [
  ['ticket.generated.827d9729d12225e209f47117', '450d9df67ef840c88f34fa73478d96c2b90db9eee68a4f983d95856ac6d4819d'],
  ['ticket.generated.80422a060f47ea4ce7871377', '0639e89199a6968f9316443c23e222ad4ba20f3114ce72d87694df6df532b86f'],
  ['ticket.generated.46644a4accc96d5bd961b9fa', 'f40eb2e706a86d54277265cd3d21b26753039ecb58287d677e51cf254a73059e'],
  ['ticket.generated.b8fa37ba78fc40c286f65d2a', '4f8f58bb0210c5ae7b2f11d2ea418c83d73552c8d940d88ddcd10b2a3d7632e2'],
  ['ticket.generated.b92a9e6c176464ba795f9dd5', 'ecbb377dc65df8e4b96f90a35ff9541562b9a229b14e7ced92fae73994288637'],
  ['ticket.generated.6c878955ff0b3d7e5edbd5a0', '71fcf1cae907451f7b83ca12d7370e59d770174a72c61f5f934ba27851513ce4'],
];

let inputs;
let proof;

test.before(async () => {
  inputs = await loadTask042Inputs();
  proof = buildTask042Proof(inputs);
});

test('pins the 257-record domain, 107 action records, and exact 83-Card playable partition', () => {
  assert.deepEqual(proof.inventory, {
    knowledge_records: 257,
    action_bearing_records: 107,
    diagnostics: 50,
    selected_repairs: 18,
    selected_validations: 15,
    playable_cards: 83,
    deferred_actions: 24,
    fingerprints: 18,
    new_response_cards: 12,
    expansion_deck_cards: 30,
  });
  assert.equal(proof.compatibility.stable_domain_ids_preserved, 257);
  assert.equal(proof.compatibility.old_card_definitions_unchanged, 70);
  assert.deepEqual(proof.compatibility.explicitly_migrated_prior_card_ids, [
    'card.bench.test.management.event_log_freshness',
  ]);
  assert.equal(proof.compatibility.old_starter_deck_unchanged, true);
});

test('validates the expansion parts, copy ledger, coverage, 257 domain records, and 83 Cards against repository schemas', () => {
  const registry = loadSchemaRegistry(ROOT);
  const byTitle = new Map(registry.schemas.map(({ schema }) => [schema.title, schema]));
  assert.deepEqual(validateJsonSchema(inputs.raw.parts, byTitle.get('Versioned authored Ticket part catalog'), registry), []);
  assert.deepEqual(validateJsonSchema(inputs.raw.technical, byTitle.get('Technical copy review ledger'), registry), []);
  assert.deepEqual(validateJsonSchema(inputs.raw.coverage, byTitle.get('Playable coverage audit'), registry), []);

  const domainSchemaTitles = {
    command: 'Command',
    component: 'Component',
    fault: 'Fault',
    fault_causal_edge: 'Fault Causal Edge',
    protocol: 'Protocol or Standard',
    repair_procedure: 'Repair Procedure',
    symptom: 'Symptom',
    test: 'Test',
    tool: 'Tool',
    validation_procedure: 'Validation Procedure',
  };
  const domainIds = new Set(inputs.raw.domain.entities.map((entity) => entity.id));
  for (const entity of inputs.raw.domain.entities) {
    const sourceShape = structuredClone(entity);
    delete sourceShape.relationships;
    assert.deepEqual(validateJsonSchema(sourceShape, byTitle.get(domainSchemaTitles[entity.entity_type]), registry), [], entity.id);
    for (const relationship of entity.relationships ?? []) {
      assert.equal(typeof relationship.role, 'string', `${entity.id} relationship role`);
      assert.ok(relationship.role.length > 0, `${entity.id} nonempty relationship role`);
      assert.ok(domainIds.has(relationship.entity_id), `${entity.id} resolves ${relationship.entity_id}`);
    }
  }
  for (const card of inputs.raw.cards.cards) {
    assert.deepEqual(validateJsonSchema(card, byTitle.get('Card Definition'), registry), [], card.id);
  }
});

test('pins immutable prior artifacts while preserving the old starter deck and Cards', () => {
  assert.deepEqual(proof.pins.old_artifact_sha256, {
    'domain-snapshot-v2.json': '2e55fc92b725d869b67b3ea73c701c55db49f9b9a2f49bcff981cebaca687a2f',
    'card-catalog-v3.json': 'e2810a99ce02b1d57ef5613e3d9d09647f5fea8dd8b3b4074baacea09bc055ef',
    'decks-v3.json': '8d9fc3ef8aa5d3932dd4fbb9349b915f4087b2c357caede6f559a2c2c24467f4',
    'playable-coverage-v3.json': '87ed2e481221485aaef3221dcf2d0a1a4979971631db5284fa3e73745d20b065',
    'task-014-parts.json': '06614e06602164e54dc36737aea89d573cd0d1b76ce863a0352a2f45e1be6c56',
  });
  const oldDeck = inputs.oldRaw.decks.decks.find((entry) => entry.id === 'deck.core.multisystem_response_v3');
  const nextDeck = inputs.raw.decks.decks.find((entry) => entry.id === 'deck.core.multisystem_response_v3');
  assert.deepEqual(nextDeck, oldDeck);
  assert.equal(inputs.raw.decks.decks.find((entry) => entry.id === 'deck.story.expansion_response_v1').card_definition_ids.length, 30);
});

test('builds six source-provenanced Tickets with unique objectives, IDs, and snapshot digests', () => {
  assert.deepEqual(proof.tickets.map((entry) => entry.fingerprint_id), EXPECTED_FINGERPRINTS);
  assert.equal(proof.tickets.length, 6);
  assert.equal(new Set(proof.tickets.map((entry) => entry.case_id)).size, 6);
  assert.equal(new Set(proof.tickets.map((entry) => entry.ticket_id)).size, 6);
  assert.equal(new Set(proof.tickets.map((entry) => entry.ticket_snapshot_digest)).size, 6);
  assert.deepEqual(proof.tickets.map((entry) => [entry.ticket_id, entry.ticket_snapshot_digest]), EXPECTED_TICKET_PINS);
  assert.equal(new Set(proof.teaching_objectives).size, 6);
  assert.ok(proof.tickets.every((entry) => /^[a-f0-9]{64}$/.test(entry.ticket_snapshot_digest)));
  assert.ok(proof.tickets.every((entry) => entry.authored_evidence_outcomes > 0));
  assert.ok(proof.tickets.every((entry) => entry.target_legal_diagnostics_with_complete_outcomes * 2 === entry.authored_evidence_outcomes));
  assert.ok(proof.tickets.every((entry) => entry.solvability_witness.some((step) => step.action === 'COMMIT_ISOLATION')));
  assert.ok(proof.tickets.every((entry) => entry.solvability_witness.some((step) => step.action === 'PERFORM_REPAIR')));
  assert.ok(proof.tickets.every((entry) => entry.solvability_witness.some((step) => step.action === 'PERFORM_VERIFY')));
  assert.ok(proof.tickets.every((entry) => entry.public_projection_hidden_truth_leaks === 0));
});

test('keeps Command exposure, useful evidence, authored routes, and minimal requirements separate', () => {
  assert.equal(proof.commands.catalog_exposure_ids.length, 13);
  assert.ok(Array.isArray(proof.commands.useful_candidate_changing_ids));
  assert.ok(Array.isArray(proof.commands.authored_isolation_route_source_ids));
  assert.ok(Array.isArray(proof.commands.minimal_witness_required_ids));
  assert.deepEqual(proof.commands.minimal_witness_required_ids, []);
  for (const ticket of proof.tickets) {
    assert.deepEqual(ticket.commands.minimal_witness_ids, []);
  }
});

test('preserves N6 UART evidence as Test and TFTP transfer as Repair transport', () => {
  assert.deepEqual(proof.n6_test_repair_boundary, {
    test_id: 'test.management.bmc_recovery_state',
    repair_id: 'repair.management.recover_bmc_firmware',
    tftp_is_diagnostic_command: false,
  });
  const n6 = proof.tickets.find((entry) => entry.case_id === 'exp-006');
  assert.ok(n6.solvability_witness.some((step) =>
    step.action === 'RUN_DIAGNOSTIC' && step.source_definition_id === 'test.management.bmc_recovery_state'));
  assert.ok(n6.repair_procedure_ids.includes('repair.management.recover_bmc_firmware'));
  assert.doesNotMatch(JSON.stringify(n6.commands), /tftp/i);
});

test('pins the sole prior Card migration to the N4 Test/Repair state boundary', () => {
  assert.deepEqual(proof.n4_test_repair_boundary, {
    migrated_card_id: 'card.bench.test.management.event_log_freshness',
    test_id: 'test.management.event_log_freshness',
    repair_id: 'repair.management.clear_stale_alert_state',
    diagnostic_changes_machine_state: false,
  });
  const n4 = proof.tickets.find((entry) => entry.case_id === 'exp-004');
  assert.ok(n4.solvability_witness.some((step) =>
    step.action === 'RUN_DIAGNOSTIC' && step.source_definition_id === 'test.management.event_log_freshness'));
  assert.ok(n4.repair_procedure_ids.includes('repair.management.clear_stale_alert_state'));
});

test('reviews technical copy and reuses accessible primary-domain art for all 12 response Cards', () => {
  assert.equal(proof.quality.technical_copy_review_records, 83);
  assert.equal(proof.quality.new_response_cards_reusing_paired_test_art, 12);
  assert.equal(proof.quality.complete_outcome_coverage_tickets, 6);
  assert.equal(proof.quality.solvable_tickets, 6);
  assert.equal(proof.quality.hidden_truth_leaks, 0);
});

test('fails closed on inventory drift and immutable-input drift', () => {
  const inventoryDrift = structuredClone(inputs);
  inventoryDrift.raw.coverage.inventory.playable_card_definitions = 82;
  assert.throws(() => buildTask042Proof(inventoryDrift), /PIN_MISMATCH/);

  const immutableDrift = structuredClone(inputs);
  immutableDrift.oldText['domain-snapshot-v2.json'] += ' ';
  assert.throws(() => buildTask042Proof(immutableDrift), /PIN_MISMATCH/);
});

test('commits byte-stable machine proof and Markdown report', async () => {
  assert.equal(await fs.readFile(TASK_042_OUTPUTS.json, 'utf8'), stableTask042Json(proof));
  assert.equal(await fs.readFile(TASK_042_OUTPUTS.markdown, 'utf8'), renderTask042Report(proof));
  const check = await generateTask042Report({ check: true });
  assert.equal(check.tickets, 6);
  assert.equal(check.objectives, 6);
});
