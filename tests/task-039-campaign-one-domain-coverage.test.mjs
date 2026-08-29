import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import {
  buildCampaignOneDomainCoverage,
  renderCampaignOneDomainCoverageMarkdown,
  stableCoverageJson,
  validateCampaignOneCoverageLedger,
} from '../src/story/campaign-one-domain-coverage.mjs';
import {
  CAMPAIGN_ONE_COVERAGE_OUTPUTS,
  generateCampaignOneDomainCoverage,
  loadCampaignOneCoverageInputs,
} from '../src/story/generate-campaign-one-domain-coverage.mjs';

const EXPECTED_TICKETS = Object.freeze([
  ['story.match.qc01.shift01.wrong_device', 'ticket.generated.ef8a4924e707349bce5c2be7', 'fingerprint.boot.incorrect_order', '821769a6021482074d523c723dc08a6b9bd2885820eabe11a9011b199fc6dacb'],
  ['story.match.qc01.shift02.power_lot', 'ticket.generated.a10b8767580c9453c679a326', 'fingerprint.power.unseated_psu', 'c55b2fb6c7aee2644929ecdd803b3b3f5155b5ec4426b43e4953d0082391e0f7'],
  ['story.match.qc01.shift02.power_lot', 'ticket.generated.8ee2c08bae1e3d005b35bff5', 'fingerprint.power.failed_psu', '8c7810616e535b8f62d3303e501bfcfdf8c9071df23903e2727b6fcb476e0d4b'],
  ['story.match.qc01.shift03.memory_compare', 'ticket.generated.75ea6ec9e60d64c7cac4caa5', 'fingerprint.memory.failed_dimm', '1bd3ccabc476313a0420cb9889ab5e7b84c60c250aa32f3d4f009f614f2c47e5'],
  ['story.match.qc01.shift03.memory_compare', 'ticket.generated.424c8fab1db6aed25058ab78', 'fingerprint.memory.unseated_dimm', '268c91a53ad795437e6690b2a5cc843071eea627671f2168b7a0dca00941a9c7'],
  ['story.match.qc01.shift04.passes_cold', 'ticket.generated.6e55cf55154d356da2e91126', 'fingerprint.thermal.clogged_heatsink', 'ce86a008060199c2f5c5cb2ed763385e8766315e35a2ce1b9b3e19fa39627a95'],
  ['story.match.qc01.shift04.passes_cold', 'ticket.generated.f60b9ce132c74c33f607df6d', 'fingerprint.thermal.failed_fan', 'b8f877726a0d4356575d9efeb51c8226c674687ba0806ba067142ffc3f90c8cd'],
  ['story.match.qc01.shift05.no_offer', 'ticket.generated.759fd75d6ac043a57d6673d7', 'fingerprint.network.incorrect_static_ip', '45f7e05c9d9a57f0e324c34d21dd1420d7c0f76ec0c4753b1494414a292697bd'],
  ['story.match.qc01.shift05.no_offer', 'ticket.generated.cbc8003979ffdaca83b41d7d', 'fingerprint.network.failed_cable', '4de1801512399068fea5881be79955af674ae35eff511d7a1d75101d6c0085d2'],
  ['story.match.qc01.shift06.quiet_cascade', 'ticket.generated.3ec80b1b0e7221ac725aedf9', 'fingerprint.boot.missing_nvme', '1c74ad0725e500ac01d4c356f17551fee11678a88b35ca5b591ff056a2efdff2'],
  ['story.match.qc01.shift06.quiet_cascade', 'ticket.generated.45a70010dd4752f864990575', 'fingerprint.storage.failed_sas_member', '863ca5c0e0a72f9440e3352c80b070f4bde1ca166c801e79425821adfa7f4420'],
  ['story.match.qc01.shift06.quiet_cascade', 'ticket.generated.5352abd871c2e9076be92a0b', 'fingerprint.storage.loose_cable', 'b06dc5a7d12c29af78edd71f7a82a611d971844e6e71863e142bc293f4e6af27'],
]);

let inputs;
let ledger;

test.before(async () => {
  inputs = await loadCampaignOneCoverageInputs();
  ledger = buildCampaignOneDomainCoverage(inputs);
});

test('reconstructs all six pinned Builder batches and complete solvability witnesses', () => {
  const actual = ledger.shifts.flatMap((shift) => shift.tickets.map((ticket) => [
    shift.match_ref,
    ticket.ticket_id,
    ticket.fingerprint_id,
    ticket.ticket_snapshot_digest,
  ]));
  assert.deepEqual(actual, EXPECTED_TICKETS);
  assert.equal(ledger.shifts.length, 6);
  assert.equal(ledger.denominators.generated_ticket_inventory, 12);
  assert.equal(ledger.denominators.actual_required_solution_paths, 12);
  assert.equal(ledger.denominators.authored_isolation_routes, 16);

  for (const ticket of ledger.shifts.flatMap((shift) => shift.tickets)) {
    const actions = ticket.minimal_authored_route.map((step) => step.action);
    assert.ok(actions.includes('RUN_DIAGNOSTIC'), `${ticket.ticket_id} has a diagnostic witness step`);
    assert.ok(actions.includes('COMMIT_ISOLATION'), `${ticket.ticket_id} has an Isolation witness step`);
    assert.ok(actions.includes('PERFORM_REPAIR'), `${ticket.ticket_id} has a Repair witness step`);
    assert.ok(actions.includes('PERFORM_VERIFY'), `${ticket.ticket_id} has a Verify witness step`);
  }
});

test('pins catalog denominators, repeated practice, uncovered totals, and opportunity tiers', () => {
  assert.deepEqual(ledger.denominators.complete_domain_inventory, {
    total: 257,
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
  });
  assert.deepEqual(ledger.denominators.action_bearing_inventory, {
    total: 107, tests: 37, commands: 13, repairs: 35, validations: 22,
  });
  assert.deepEqual(ledger.denominators.playable_action_inventory, {
    total: 71, diagnostics: 50, repairs: 12, validations: 9,
  });
  assert.equal(ledger.denominators.supported_fingerprint_inventory, 12);
  assert.deepEqual(ledger.deterministic_totals.unique, {
    symptoms: 9,
    public_candidate_faults: 28,
    truth_faults: 18,
    actionable_faults: 12,
    terminal_faults: 6,
    declared_diagnostic_plan_sources: 20,
    candidate_changing_diagnostics: 30,
    target_legal_diagnostics: 43,
    isolation_route_sources: 18,
    minimal_witness_diagnostics: 14,
    repairs: 12,
    verifications: 9,
  });
  assert.deepEqual(ledger.deterministic_totals.practice, {
    symptoms: 12,
    public_candidate_faults: 44,
    truth_fault_instances: 19,
    minimal_witness_diagnostics: 15,
    repairs: 12,
    verifications: 15,
  });
  assert.equal(ledger.uncovered.playable_diagnostics_not_in_minimal_witness_ids.length, 36);
  assert.deepEqual(ledger.deterministic_totals.diagnostic_partition.counts, {
    minimal_witness: 14,
    candidate_changing_but_non_minimal: 16,
    target_legal_candidate_neutral: 13,
    not_target_legal: 7,
  });
  const partitionIds = Object.values(ledger.deterministic_totals.diagnostic_partition.classes).flat();
  assert.equal(partitionIds.length, 50);
  assert.equal(new Set(partitionIds).size, 50);
  assert.ok(ledger.deterministic_totals.diagnostic_partition.classes.candidate_changing_but_non_minimal
    .includes('command.linux.ip_addr'));
  assert.equal(ledger.uncovered.symptom_ids.length, 24);
  assert.equal(ledger.uncovered.public_candidate_fault_ids.length, 14);
  assert.equal(ledger.uncovered.causal_edge_ids.length, 10);
  assert.equal(ledger.uncovered.deferred_action_definition_ids.length, 36);
  assert.equal(ledger.opportunity_inventory.uncovered_but_already_playable.length, 3);
  assert.equal(ledger.opportunity_inventory.present_but_not_playable_in_complete_ticket_path.length, 8);
  assert.equal(ledger.opportunity_inventory.absent_from_current_domain.length, 4);
});

test('keeps Commands, narrative mentions, technical dependencies, and closure roles distinct', () => {
  assert.deepEqual(ledger.deterministic_totals.commands, {
    global_playable: 13,
    declared_diagnostic_plan_sources: 1,
    candidate_changing: 6,
    target_legal: 11,
    authored_isolation_route_sources: 1,
    minimal_witness_actions: 0,
    required_by_any_current_isolation_route: ['command.linux.smartctl'],
  });
  const failedSas = ledger.shifts.flatMap((shift) => shift.tickets)
    .find((ticket) => ticket.fingerprint_id === 'fingerprint.storage.failed_sas_member');
  assert.deepEqual(failedSas.diagnostics.isolation_routes[1].source_definition_ids, [
    'test.storage.raid_status',
    'command.linux.smartctl',
  ]);
  assert.ok(ledger.shifts.every((shift) => shift.narrative_mentions.length > 0));
  assert.equal(ledger.shifts.flatMap((shift) => shift.narrative_mentions).length, 15);
  assert.equal(ledger.entity_coverage.length, 257);
  assert.ok(ledger.entity_coverage.find((row) => row.id === 'command.linux.ip_addr').coverage_roles
    .some((use) => use.role === 'CANDIDATE_CHANGING_DIAGNOSTIC'));
  assert.deepEqual(validateCampaignOneCoverageLedger(ledger), []);
});

test('rejects stale IDs, impossible roles, changed totals, text drift, and Ticket pin drift', () => {
  const staleIdInputs = {
    ...inputs,
    canonicalEntities: inputs.canonicalEntities.map((entity, index) => index === 0
      ? { ...entity, id: `${entity.id}.stale` }
      : entity),
  };
  assert.throws(() => buildCampaignOneDomainCoverage(staleIdInputs), /SNAPSHOT_DRIFT/);

  const impossibleRole = structuredClone(ledger);
  impossibleRole.entity_coverage.find((row) => row.entity_type === 'symptom').coverage_roles.push({
    role: 'MINIMAL_WITNESS_DIAGNOSTIC',
    match_ref: 'story.match.qc01.shift01.wrong_device',
  });
  assert.throws(() => validateCampaignOneCoverageLedger(impossibleRole), /IMPOSSIBLE_ROLE/);

  const changedTotals = structuredClone(ledger);
  changedTotals.deterministic_totals.unique.symptoms += 1;
  assert.throws(() => validateCampaignOneCoverageLedger(changedTotals), /PIN_MISMATCH/);

  const missingTextInputs = { ...inputs, textCatalog: structuredClone(inputs.textCatalog) };
  delete missingTextInputs.textCatalog.entries['text.qc01.match.shift01.setup'];
  assert.throws(() => buildCampaignOneDomainCoverage(missingTextInputs), /NARRATIVE_TEXT_MISSING/);

  const ticketDriftInputs = { ...inputs, matchRegistry: structuredClone(inputs.matchRegistry) };
  ticketDriftInputs.matchRegistry.matches[0].expected_ticket_snapshot_digests[0] = 'stale';
  assert.throws(() => buildCampaignOneDomainCoverage(ticketDriftInputs), /TICKET_PIN_MISMATCH/);
});

test('renders byte-stable committed JSON and Markdown and passes --check semantics', async () => {
  const rebuilt = buildCampaignOneDomainCoverage(inputs);
  assert.equal(stableCoverageJson(rebuilt), stableCoverageJson(ledger));
  assert.equal(renderCampaignOneDomainCoverageMarkdown(rebuilt), renderCampaignOneDomainCoverageMarkdown(ledger));
  assert.equal(await fs.readFile(CAMPAIGN_ONE_COVERAGE_OUTPUTS.json, 'utf8'), stableCoverageJson(ledger));
  assert.equal(await fs.readFile(CAMPAIGN_ONE_COVERAGE_OUTPUTS.markdown, 'utf8'), renderCampaignOneDomainCoverageMarkdown(ledger));
  assert.deepEqual((await generateCampaignOneDomainCoverage({ check: true })).files, [
    'docs/story/coverage/campaign-one-domain-coverage.json',
    'docs/story/coverage/CAMPAIGN_ONE_DOMAIN_COVERAGE.md',
  ]);
});
