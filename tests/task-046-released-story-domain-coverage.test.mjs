import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import {
  buildReleasedStoryDomainCoverage,
  renderReleasedStoryDomainCoverageMarkdown,
  stableCoverageJson,
  validateReleasedStoryCoverageLedger,
} from '../src/story/released-story-domain-coverage.mjs';
import {
  RELEASED_STORY_COVERAGE_OUTPUTS,
  generateReleasedStoryDomainCoverage,
  loadReleasedStoryCoverageInputs,
} from '../src/story/generate-released-story-domain-coverage.mjs';

let inputs;
let ledger;

test.before(async () => {
  inputs = await loadReleasedStoryCoverageInputs();
  ledger = buildReleasedStoryDomainCoverage(inputs);
});

test('composes twelve exact real Builder, solvability, and engine proofs through the release registry', () => {
  assert.deepEqual(ledger.proof_totals, {
    registry_matches: 12,
    builder_constructed_at_exact_pins: 12,
    engine_matches_succeeded: 12,
    deterministic_engine_reruns: 12,
    solvability_witnessed_tickets: 18,
    exact_ticket_pins_matched: 18,
  });
  assert.equal(ledger.matches.length, 12);
  assert.deepEqual(ledger.matches.map((entry) => entry.match_ref), inputs.releaseMatches.matches.map((entry) => entry.match_ref));
  assert.ok(ledger.matches.slice(0, 6).every((entry) => entry.segment === 'CAMPAIGN_ONE'
    && entry.builder_contract.kind === 'LEGACY_TOP_LEVEL_PROFILE'
    && entry.builder_contract.configuration_version === 'ticket-builder-v3'));
  assert.ok(ledger.matches.slice(6).every((entry) => entry.segment === 'EXPANSION'
    && entry.builder_contract.kind === 'EMBEDDED_V4_CONFIGURATION'
    && entry.builder_contract.configuration_version === 'ticket-builder-v4'));
  assert.ok(ledger.matches.every((entry) => entry.builder_proof.status === 'SUCCESS'
    && entry.builder_proof.exact_pin_match
    && entry.engine_proof.classification === 'SUCCEEDED'
    && entry.engine_proof.deterministic_rerun_identical));

  for (const [index, entry] of ledger.matches.entries()) {
    const definition = inputs.releaseMatches.matches[index];
    assert.deepEqual(entry.tickets.map((ticket) => ticket.ticket_id), definition.expected_ticket_definition_ids);
    assert.deepEqual(entry.tickets.map((ticket) => ticket.ticket_snapshot_digest), definition.expected_ticket_snapshot_digests);
    assert.equal(entry.tickets.length, definition.requested_ticket_count);
    assert.ok(entry.tickets.every((ticket) => ticket.oracle_witness.some((step) => step.action === 'RUN_DIAGNOSTIC')
      && ticket.oracle_witness.some((step) => step.action === 'COMMIT_ISOLATION')
      && ticket.oracle_witness.some((step) => step.action === 'PERFORM_REPAIR')
      && ticket.oracle_witness.some((step) => step.action === 'PERFORM_VERIFY')));
  }
});

test('pins the additive v4/v5 denominators and counts only actual required paths as practice', () => {
  assert.deepEqual(ledger.denominators, {
    domain_entities: 257,
    by_entity_type: {
      command: 13,
      component: 25,
      fault: 42,
      fault_causal_edge: 17,
      protocol: 20,
      repair_procedure: 35,
      symptom: 33,
      test: 37,
      tool: 13,
      validation_procedure: 22,
    },
    action_bearing_entities: 107,
    playable_cards: 83,
    global_bench_diagnostics: 50,
    selected_repairs: 18,
    selected_validations: 15,
    supported_fingerprints: 18,
    symptoms: 33,
    faults: 42,
  });
  assert.equal(ledger.authored_totals.matches, 12);
  assert.equal(ledger.authored_totals.tickets, 18);
  assert.equal(ledger.authored_totals.symptoms.unique_count, 19);
  assert.equal(ledger.authored_totals.symptoms.ticket_role_occurrences, 22);
  assert.equal(ledger.authored_totals.public_candidate_faults.unique_count, 36);
  assert.equal(ledger.authored_totals.truth_faults.unique_count, 24);
  assert.equal(ledger.authored_totals.fingerprints.unique_count, 18);
  assert.equal(ledger.authored_totals.minimal_witness_diagnostics.unique_count, 21);
  assert.equal(ledger.authored_totals.minimal_witness_diagnostics.ticket_role_occurrences, 22);
  assert.equal(ledger.authored_totals.repairs.unique_count, 18);
  assert.equal(ledger.authored_totals.verifications.unique_count, 15);
  assert.equal(ledger.authored_totals.minimal_required_cards.unique_count, 54);
  assert.equal(ledger.authored_totals.closure_publications, 18);
  assert.equal(ledger.authored_totals.explicit_document_live_requirements, 0);
});

test('keeps catalog, relevance, Candidate change, Isolation, and minimal-witness Command roles separate', () => {
  assert.equal(ledger.diagnostic_role_boundary.global_bench_count, 50);
  assert.equal(ledger.diagnostic_role_boundary.match_relevant_count, 43);
  assert.equal(ledger.diagnostic_role_boundary.proven_candidate_changing_count, 36);
  assert.equal(ledger.diagnostic_role_boundary.minimal_witness_count, 21);
  assert.deepEqual(ledger.diagnostic_role_boundary.commands, {
    global_bench_count: 13,
    match_relevant_ids: [
      'command.linux.dhclient',
      'command.linux.ip_addr',
      'command.linux.ip_route',
      'command.linux.lsblk',
      'command.linux.lspci',
      'command.linux.nvme_smart_log',
      'command.linux.smartctl',
      'command.network.ping',
    ],
    authored_isolation_route_source_ids: ['command.linux.smartctl'],
    expansion_required_isolation_ids: [],
    minimal_witness_count: 0,
  });
  assert.equal(ledger.uncovered.diagnostic_ids_not_match_relevant.length, 7);
  assert.equal(ledger.uncovered.diagnostic_ids_not_in_minimal_witness.length, 29);
  assert.deepEqual(ledger.uncovered.supported_fingerprint_ids, []);
  assert.deepEqual(ledger.uncovered.selected_repair_ids, []);
  assert.deepEqual(ledger.uncovered.selected_validation_ids, []);
  assert.equal(ledger.uncovered.symptom_ids.length, 14);
  assert.equal(ledger.uncovered.public_candidate_fault_ids.length, 6);
  assert.equal(ledger.uncovered.truth_fault_ids.length, 18);
});

test('the expansion adds seven distinct required diagnostics without claiming policy-only execution', () => {
  const expansionMinimal = new Set(ledger.matches.slice(6)
    .flatMap((entry) => entry.tickets)
    .flatMap((ticket) => ticket.diagnostics.minimal_witness_source_ids));
  assert.deepEqual([...expansionMinimal].sort(), [
    'test.compute.socket_magnified_inspection',
    'test.firmware.version_compatibility',
    'test.management.bmc_recovery_state',
    'test.management.event_log_freshness',
    'test.network.link_counter_soak',
    'test.power.distribution_path_isolation',
    'test.storage.predictive_health',
  ]);
  assert.match(ledger.interpretation_limits.join('\n'), /proof policy may execute additional diagnostics/i);
  assert.match(ledger.proof_composition.limitation, /does not relabel them as v4 builds/i);
  assert.deepEqual(validateReleasedStoryCoverageLedger(ledger), []);
});

test('fails closed on a release Ticket pin, proof status, catalog version, or impossible total drift', () => {
  const ticketDrift = structuredClone(inputs);
  ticketDrift.releaseMatches.matches[0].expected_ticket_snapshot_digests[0] = '0'.repeat(64);
  assert.throws(() => buildReleasedStoryDomainCoverage(ticketDrift), /MATCH_CONFIGURATION_DRIFT/);

  const proofDrift = structuredClone(inputs);
  proofDrift.expansionBuilderProof.matches[0].engine.classification = 'FAILED';
  assert.throws(() => buildReleasedStoryDomainCoverage(proofDrift), /EXPANSION_PROOF_FAILED/);

  const catalogDrift = structuredClone(inputs);
  catalogDrift.cards.card_catalog_version = 'stale';
  assert.throws(() => buildReleasedStoryDomainCoverage(catalogDrift), /PIN_MISMATCH/);

  const totalDrift = structuredClone(ledger);
  totalDrift.authored_totals.minimal_witness_diagnostics.unique_count += 1;
  assert.throws(() => validateReleasedStoryCoverageLedger(totalDrift), /PIN_MISMATCH/);
});

test('renders committed byte-stable machine and human reports and passes check mode', async () => {
  const rebuilt = buildReleasedStoryDomainCoverage(inputs);
  assert.equal(stableCoverageJson(rebuilt), stableCoverageJson(ledger));
  assert.equal(renderReleasedStoryDomainCoverageMarkdown(rebuilt), renderReleasedStoryDomainCoverageMarkdown(ledger));
  assert.equal(await fs.readFile(RELEASED_STORY_COVERAGE_OUTPUTS.json, 'utf8'), stableCoverageJson(ledger));
  assert.equal(await fs.readFile(RELEASED_STORY_COVERAGE_OUTPUTS.markdown, 'utf8'), renderReleasedStoryDomainCoverageMarkdown(ledger));
  assert.deepEqual((await generateReleasedStoryDomainCoverage({ check: true })).files, [
    'docs/story/coverage/released-story-domain-coverage-v3.json',
    'docs/story/coverage/RELEASED_STORY_DOMAIN_COVERAGE_V3.md',
  ]);
});
